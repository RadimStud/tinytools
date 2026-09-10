import { randomUUID } from "node:crypto";
import type { AppUser } from "@/modules/users/domain/user";
import { VaultError, validateUpload, validateFileId, type PublicVaultFile } from "../domain/vault";
import type { VaultRepository } from "../repositories/vault-repository";

export interface VaultStorage {
  uploadUrl(key: string): Promise<string>;
  downloadUrl(key: string, name: string): Promise<string>;
  size(key: string): Promise<number | null>;
  remove(key: string): Promise<void>;
}
export class VaultService {
  constructor(
    private readonly auth: { syncCurrentUser(): Promise<AppUser | null> },
    private readonly repository: VaultRepository,
    private readonly storage: VaultStorage,
  ) {}

  async canAccess(userId: string) { return this.repository.hasPermission(userId); }

  async requireUser() {
    const user = await this.auth.syncCurrentUser();
    if (!user) throw new VaultError("Sign in to continue.", 401);
    if (!await this.repository.hasPermission(user.id)) throw new VaultError("Superuser access required.", 403);
    return user;
  }

  async list(): Promise<PublicVaultFile[]> {
    const user = await this.requireUser();
    return (await this.repository.list(user.id)).map(file => ({
      id: file.id, name: file.name, sizeBytes: file.sizeBytes,
      status: file.status, createdAt: file.createdAt.toISOString(),
    }));
  }

  async prepare(name: unknown, size: unknown) {
    const user = await this.requireUser();
    const input = validateUpload(name, size);
    const id = randomUUID();
    const key = `vault/${user.id}/${id}/payload`;
    const uploadUrl = await this.storage.uploadUrl(key);
    await this.repository.create({ id, ownerId: user.id, name: input.name, sizeBytes: input.size, fileKey: key, status: "pending", createdAt: new Date() });
    return { id, uploadUrl };
  }

  private async owned(id: string) {
    const user = await this.requireUser();
    validateFileId(id);
    const file = await this.repository.find(user.id, id);
    if (!file) throw new VaultError("File not found.", 404);
    return file;
  }

  async complete(id: string) {
    const file = await this.owned(id);
    if (file.status === "ready") return;
    if (file.status !== "pending") throw new VaultError("Upload is no longer available.", 409);
    const size = await this.storage.size(file.fileKey);
    if (size !== file.sizeBytes) throw new VaultError("Upload size does not match. Remove it and upload again.", 409);
    if (!await this.repository.markReady(file.ownerId, id)) throw new VaultError("Upload was removed. Refresh your vault.", 409);
  }

  async download(id: string) {
    const file = await this.owned(id);
    if (file.status !== "ready") throw new VaultError("File is not ready for download.", 404);
    return this.storage.downloadUrl(file.fileKey, file.name);
  }

  async remove(id: string) {
    const file = await this.owned(id);
    // Hide first, so a storage failure cannot expose the file through this app.
    await this.repository.markDeleted(file.ownerId, id);
    await this.storage.remove(file.fileKey);
  }
}
