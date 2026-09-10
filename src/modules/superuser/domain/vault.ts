export const MAX_VAULT_FILE_SIZE = 250 * 1024 * 1024;
export type VaultFile = {
  id: string;
  ownerId: string;
  name: string;
  fileKey: string;
  sizeBytes: number;
  status: "pending" | "ready" | "deleted";
  createdAt: Date;
};
export type PublicVaultFile = Pick<VaultFile, "id" | "name" | "sizeBytes" | "status"> & { createdAt: string };
export class VaultError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}
export function validateUpload(name: unknown, size: unknown) {
  if (typeof name !== "string" || !name.trim() || name.length > 240 || /[\x00-\x1f\x7f/\\]/.test(name)) {
    throw new VaultError("Use a filename of 1–240 characters without path separators.", 400);
  }
  if (typeof size !== "number" || !Number.isInteger(size) || size <= 0 || size > MAX_VAULT_FILE_SIZE) {
    throw new VaultError("Choose a non-empty file up to 250 MB.", 400);
  }
  return { name: name.trim(), size };
}
export function validateFileId(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new VaultError("File not found.", 404);
  }
}
