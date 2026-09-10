import { beforeEach, describe, expect, it, vi } from "vitest";

const { sql } = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock("@/infrastructure/db/client", () => ({ sql }));

import { PostgresVaultRepository } from "./postgres-vault-repository";

const row = {
  id: "file-id", owner_id: "owner-id", name: "notes.txt",
  file_key: "vault/owner-id/file-id/payload", size_bytes: 12,
  status: "ready", created_at: "2026-09-10 22:30:00+00",
};

describe("PostgresVaultRepository timestamps", () => {
  beforeEach(() => sql.mockReset());

  it.each([row.created_at, new Date("2026-09-10T22:30:00.000Z")])(
    "normalizes list timestamps from %s for ISO serialization",
    async created_at => {
      sql.mockResolvedValue([{ ...row, created_at }]);
      const files = await new PostgresVaultRepository().list(row.owner_id);
      expect(files[0].createdAt.toISOString()).toBe("2026-09-10T22:30:00.000Z");
    },
  );

  it("normalizes timestamps when finding a single file", async () => {
    sql.mockResolvedValue([row]);
    const file = await new PostgresVaultRepository().find(row.owner_id, row.id);
    expect(file?.createdAt.toISOString()).toBe("2026-09-10T22:30:00.000Z");
  });

  it("rejects invalid timestamps at the database boundary", async () => {
    sql.mockResolvedValue([{ ...row, created_at: "invalid" }]);
    await expect(new PostgresVaultRepository().list(row.owner_id)).rejects.toThrow("Invalid vault file timestamp.");
  });
});
