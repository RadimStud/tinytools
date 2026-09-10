import { sql } from "@/infrastructure/db/client";
import type { VaultFile } from "../domain/vault";
import type { VaultRepository } from "./vault-repository";

type Row = { id: string; owner_id: string; name: string; file_key: string; size_bytes: number; status: VaultFile["status"]; created_at: Date | string };
function map(row: Row): VaultFile {
  const createdAt = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
  if (Number.isNaN(createdAt.getTime())) throw new Error("Invalid vault file timestamp.");
  return { id: row.id, ownerId: row.owner_id, name: row.name, fileKey: row.file_key, sizeBytes: row.size_bytes, status: row.status, createdAt };
}
export class PostgresVaultRepository implements VaultRepository {
  async hasPermission(userId: string) {
    const rows = await sql`SELECT user_id FROM superuser_permissions WHERE user_id = ${userId}`;
    return rows.length === 1;
  }
  async list(ownerId: string) {
    const rows = await sql<Row[]>`SELECT * FROM vault_files WHERE owner_id = ${ownerId} AND status != 'deleted' ORDER BY created_at DESC`;
    return rows.map(map);
  }
  async find(ownerId: string, id: string) {
    const rows = await sql<Row[]>`SELECT * FROM vault_files WHERE owner_id = ${ownerId} AND id = ${id}`;
    return rows[0] ? map(rows[0]) : null;
  }
  async create(file: VaultFile) {
    await sql`INSERT INTO vault_files (id, owner_id, name, file_key, size_bytes) VALUES (${file.id}, ${file.ownerId}, ${file.name}, ${file.fileKey}, ${file.sizeBytes})`;
  }
  async markReady(ownerId: string, id: string) {
    const rows = await sql`UPDATE vault_files SET status = 'ready' WHERE owner_id = ${ownerId} AND id = ${id} AND status = 'pending' RETURNING id`;
    return rows.length === 1;
  }
  async markDeleted(ownerId: string, id: string) {
    await sql`UPDATE vault_files SET status = 'deleted' WHERE owner_id = ${ownerId} AND id = ${id}`;
  }
}
