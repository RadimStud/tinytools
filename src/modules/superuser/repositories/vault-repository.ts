import type { VaultFile } from "../domain/vault";
export interface VaultRepository {
  hasPermission(userId: string): Promise<boolean>;
  list(ownerId: string): Promise<VaultFile[]>;
  find(ownerId: string, id: string): Promise<VaultFile | null>;
  create(file: VaultFile): Promise<void>;
  markReady(ownerId: string, id: string): Promise<boolean>;
  markDeleted(ownerId: string, id: string): Promise<void>;
}
