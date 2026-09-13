import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PostgresPlatformRepository } from "@/modules/platform/repositories/postgres-platform-repository";
import { PlatformService } from "@/modules/platform/services/platform-service";
import type { AccessChange } from "@/modules/platform/domain/platform";

const url = new URL(process.env.PLATFORM_TEST_DATABASE_URL ?? "http://invalid");
if (!["postgres:", "postgresql:"].includes(url.protocol) || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || url.pathname !== "/minikit_platform_test") {
  throw new Error("Integration tests require PLATFORM_TEST_DATABASE_URL pointing to a LOCAL minikit_platform_test database. DATABASE_URL and dotenv are never used.");
}
const sql = postgres(url.toString(), { max: 4, prepare: false });
const repository = new PostgresPlatformRepository(sql);
const admin = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", a = "11111111-1111-4111-8111-111111111111", b = "22222222-2222-4222-8222-222222222222", marketAdmin = "33333333-3333-4333-8333-333333333333";
let migration = "";
const change = (patch: Partial<AccessChange> = {}): AccessChange => ({ subject: a, app_id: "orion", status: "enabled", app_role: "user", expected_policy_version: 0, reason: "Isolated test access", ...patch });
beforeAll(async () => {
  await sql.unsafe(await fs.readFile("tests/platform/legacy-fixture.sql", "utf8"));
  migration = await fs.readFile("drizzle/0004_platform_accounts.sql", "utf8");
  await sql.begin(async tx => { await tx.unsafe(migration); });
});
beforeEach(async () => {
  await sql`TRUNCATE public.admin_audit_events, public.app_access, public.platform_admins`;
});
afterAll(async () => { await sql.end(); });
async function grantOperator() {
  await sql`INSERT INTO public.platform_admins (auth_user_id,reason) VALUES (${admin}, 'Explicit isolated test bootstrap')`;
}

describe("P1 with real isolated PostgreSQL", () => {
  it("migration is repeatable, grants nobody and preserves Market/Superuser rows", async () => {
    await sql.begin(async tx => { await tx.unsafe(migration); });
    expect(await repository.isPlatformAdmin(marketAdmin)).toBe(false);
    expect((await sql`SELECT * FROM public.platform_admins`).length).toBe(0);
    expect((await sql`SELECT * FROM public.tools WHERE name='Existing tool sentinel'`).length).toBe(1);
    expect((await sql`SELECT * FROM public.superuser_permissions WHERE user_id=${a}`).length).toBe(1);
    expect((await sql`SELECT role FROM public.users WHERE auth_user_id=${marketAdmin}`)[0].role).toBe("admin");
    expect((await repository.listApps()).find(app => app.app_id === "orion")?.state).toBe("coming_soon");
  });
  it("rejects a Market administrator at the repository write boundary", async () => {
    await expect(repository.changeAccess(marketAdmin, change(), randomUUID())).rejects.toMatchObject({ status: 403 });
    expect(await repository.listAccess(a)).toEqual([]);
  });
  it("keeps A/B identities and application grants separate", async () => {
    await grantOperator(); await repository.changeAccess(admin, change(), randomUUID());
    const service = (subject: string) => new PlatformService({ syncCurrentUser: async () => ({ authUserId: subject, displayName: "Test" }) }, repository, () => true);
    expect((await service(a).me()).subject).toBe(a); expect((await service(b).me()).subject).toBe(b);
    expect((await service(a).access("orion")).access).toBe("enabled");
    expect((await service(b).access("orion")).access).toBe("none");
    expect((await service(a).access("orion")).launch_path).toBeNull();
    await expect(service(a).adminOverview()).rejects.toMatchObject({ status: 403 });
  });
  it("rechecks revocation and makes access change/audit atomic", async () => {
    await grantOperator(); await repository.changeAccess(admin, change(), randomUUID());
    await repository.changeAccess(admin, change({ status: "revoked", expected_policy_version: 1 }), randomUUID());
    expect((await repository.listAccess(a))[0]).toMatchObject({ status: "revoked", policy_version: 2 });
    expect((await repository.recentAudit()).filter(event => event.outcome === "success")).toHaveLength(2);
    await sql`DELETE FROM public.platform_admins WHERE auth_user_id=${admin}`;
    await expect(repository.changeAccess(admin, change({ expected_policy_version: 2 }), randomUUID())).rejects.toMatchObject({ status: 403 });
  });
  it("serializes concurrent first writes and rejects the stale policy version", async () => {
    await grantOperator();
    const outcomes = await Promise.allSettled([
      repository.changeAccess(admin, change(), randomUUID()),
      repository.changeAccess(admin, change({ status: "suspended" }), randomUUID()),
    ]);
    expect(outcomes.filter(outcome => outcome.status === "fulfilled")).toHaveLength(1);
    const rejected = outcomes.find(outcome => outcome.status === "rejected");
    expect(rejected && rejected.status === "rejected" ? rejected.reason.code : "").toBe("policy_conflict");
    expect((await repository.listAccess(a))[0].policy_version).toBe(1);
    expect((await repository.recentAudit()).map(event => event.outcome).sort()).toEqual(["conflict", "success"]);
  });
  it("rolls back the access update when its audit insert fails", async () => {
    await grantOperator(); const requestId = randomUUID();
    await repository.changeAccess(admin, change(), requestId);
    await expect(repository.changeAccess(admin, change({ status: "revoked", expected_policy_version: 1 }), requestId)).rejects.toBeDefined();
    expect((await repository.listAccess(a))[0]).toMatchObject({ status: "enabled", policy_version: 1 });
    expect(await repository.recentAudit()).toHaveLength(1);
  });
  it("does not change explicit free-product policies through access grants", async () => {
    await grantOperator();
    await expect(repository.changeAccess(admin, change({ app_id: "market" }), randomUUID())).rejects.toMatchObject({ code: "free_policy_not_editable" });
  });
  it("enforces foreign keys and a unique user/application pair", async () => {
    await grantOperator();
    await expect(repository.changeAccess(admin, change({ subject: "99999999-9999-4999-8999-999999999999" }), randomUUID())).rejects.toMatchObject({ status: 404 });
    await repository.changeAccess(admin, change(), randomUUID());
    await expect(sql`INSERT INTO public.app_access(auth_user_id,app_id,status,app_role,policy_version,changed_by) VALUES (${a}, 'orion', 'enabled', 'user', 1, ${admin})`).rejects.toMatchObject({ code: "23505" });
  });
  it.each(["anon", "authenticated"])("denies direct client-role reads/writes for %s", async role => {
    await expect(sql.begin(async tx => {
      if (role === "anon") await tx`SET LOCAL ROLE anon`; else await tx`SET LOCAL ROLE authenticated`;
      await tx`SELECT * FROM public.platform_admins`;
    })).rejects.toMatchObject({ code: "42501" });
    await expect(sql.begin(async tx => {
      if (role === "anon") await tx`SET LOCAL ROLE anon`; else await tx`SET LOCAL ROLE authenticated`;
      await tx`INSERT INTO public.platform_admins(auth_user_id,reason) VALUES (${a},'Self promotion rejected')`;
    })).rejects.toMatchObject({ code: "42501" });
  });
});
