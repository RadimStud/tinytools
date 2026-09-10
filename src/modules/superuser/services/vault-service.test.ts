import { describe, expect, it, vi } from "vitest";
import type { AppUser } from "@/modules/users/domain/user";
import { VaultService } from "./vault-service";
import type { VaultFile } from "../domain/vault";

const id = "3017e909-c615-44c4-a548-c4b1f9763358";
const owner: AppUser = { id: "owner", authUserId: "auth-owner", displayName: "Owner", role: "admin", createdAt: new Date() };
function setup(user: AppUser | null = owner, permission = true) {
  const file: VaultFile = { id, ownerId: "owner", name: "notes.txt", fileKey: "vault/owner/one/payload", sizeBytes: 12, status: "pending", createdAt: new Date() };
  const repository = {
    hasPermission: vi.fn().mockResolvedValue(permission),
    list: vi.fn().mockResolvedValue([file]),
    find: vi.fn().mockImplementation(async (ownerId: string, fileId: string) => ownerId === file.ownerId && fileId === file.id ? file : null),
    create: vi.fn(), markReady: vi.fn().mockResolvedValue(true), markDeleted: vi.fn(),
  };
  const storage = { uploadUrl: vi.fn().mockResolvedValue("https://storage/upload"), downloadUrl: vi.fn().mockResolvedValue("https://storage/download"), size: vi.fn().mockResolvedValue(12), remove: vi.fn() };
  const service = new VaultService({ syncCurrentUser: async () => user }, repository, storage);
  return { service, repository, storage, file };
}
describe("Private vault access", () => {
  for (const [label, user, granted, status] of [
    ["anonymous", null, false, 401],
    ["regular user", { ...owner, role: "user" as const }, false, 403],
    ["admin without superuser", owner, false, 403],
  ] as const) {
    it(`denies every operation for ${label}`, async () => {
      const { service, repository, storage } = setup(user, granted);
      for (const operation of [() => service.list(), () => service.prepare("a.txt", 12), () => service.complete(id), () => service.download(id), () => service.remove(id)]) {
        await expect(operation()).rejects.toMatchObject({ status });
      }
      expect(repository.list).not.toHaveBeenCalled();
      expect(repository.find).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
      for (const method of Object.values(storage)) expect(method).not.toHaveBeenCalled();
    });
  }
  it("does not depend on the admin role when explicit permission exists", async () => {
    const { service } = setup({ ...owner, role: "user" });
    await expect(service.list()).resolves.toHaveLength(1);
  });
  it("never returns storage keys in the file directory", async () => {
    const { service } = setup();
    expect((await service.list())[0]).not.toHaveProperty("fileKey");
  });
  it("enforces ownership even when a permission provider grants another account", async () => {
    const { service, storage } = setup({ ...owner, id: "other" });
    await expect(service.download(id)).rejects.toMatchObject({ status: 404 });
    await expect(service.complete(id)).rejects.toMatchObject({ status: 404 });
    await expect(service.remove(id)).rejects.toMatchObject({ status: 404 });
    expect(storage.downloadUrl).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled();
  });
  it("checks permission again after revocation", async () => {
    const { service, repository, storage, file } = setup();
    file.status = "ready";
    await service.download(id);
    repository.hasPermission.mockResolvedValue(false);
    await expect(service.download(id)).rejects.toMatchObject({ status: 403 });
    expect(storage.downloadUrl).toHaveBeenCalledTimes(1);
  });
  it("rejects path filenames, invalid sizes, and malformed IDs", async () => {
    const { service, storage } = setup();
    for (const [name, size] of [["../x", 2], ["a", 0], ["a", 262144001], ["a", 1.5], ["a\n.txt", 2], ["", 2]]) {
      await expect(service.prepare(name, size)).rejects.toMatchObject({ status: 400 });
    }
    await expect(service.download("bad-id")).rejects.toMatchObject({ status: 404 });
    expect(storage.uploadUrl).not.toHaveBeenCalled();
  });
  it("generates distinct object keys for files with the same name", async () => {
    const { service, repository } = setup();
    await service.prepare("notes.txt", 12);
    await service.prepare("notes.txt", 12);
    const [a, b] = repository.create.mock.calls.map(call => call[0]);
    expect(a.fileKey).not.toBe(b.fileKey);
    expect(a.fileKey).toMatch(/^vault\/owner\//);
  });
  it("refuses to finalize an incomplete upload", async () => {
    const { service, storage, repository } = setup();
    storage.size.mockResolvedValue(11);
    await expect(service.complete(id)).rejects.toMatchObject({ status: 409 });
    expect(repository.markReady).not.toHaveBeenCalled();
  });
  it("does not issue downloads for pending or deleted files", async () => {
    const { service, file, storage } = setup();
    await expect(service.download(id)).rejects.toMatchObject({ status: 404 });
    file.status = "deleted";
    await expect(service.download(id)).rejects.toMatchObject({ status: 404 });
    expect(storage.downloadUrl).not.toHaveBeenCalled();
  });
  it("detects deletion racing with upload completion", async () => {
    const { service, repository } = setup();
    repository.markReady.mockResolvedValue(false);
    await expect(service.complete(id)).rejects.toMatchObject({ status: 409 });
  });
  it("hides files before attempting removal from storage", async () => {
    const { service, repository, storage } = setup();
    storage.remove.mockImplementation(async () => {
      expect(repository.markDeleted).toHaveBeenCalledWith("owner", id);
      throw new Error("Storage offline");
    });
    await expect(service.remove(id)).rejects.toThrow("Storage offline");
  });
});
