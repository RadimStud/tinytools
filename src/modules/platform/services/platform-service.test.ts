import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlatformService } from "./platform-service";
import { appView, type PlatformApp } from "../domain/platform";
import type { PlatformRepository } from "../repositories/platform-repository";

const subject = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const orion: PlatformApp = { app_id: "orion", name: "ORION", description: "Not integrated", state: "coming_soon", internal_path: null, access_mode: "explicit", contract_version: "1.0" };
const market: PlatformApp = { app_id: "market", name: "Market", description: "Existing market", state: "available", internal_path: "/dashboard", access_mode: "authenticated_free", contract_version: "1.0" };
const repo = {
  isPlatformAdmin: vi.fn(), listApps: vi.fn(), listAccess: vi.fn(), listUsers: vi.fn(), recentAudit: vi.fn(), changeAccess: vi.fn(),
} satisfies PlatformRepository;
const currentUser = { syncCurrentUser: vi.fn() };
let service: PlatformService;
beforeEach(() => {
  vi.resetAllMocks();
  currentUser.syncCurrentUser.mockResolvedValue({ authUserId: subject, displayName: "Account A", role: "admin", user_metadata: { role: "platform_admin" } });
  repo.isPlatformAdmin.mockResolvedValue(false); repo.listApps.mockResolvedValue([market, orion]); repo.listAccess.mockResolvedValue([]);
  repo.listUsers.mockResolvedValue([]); repo.recentAudit.mockResolvedValue([]);
  service = new PlatformService(currentUser, repo, () => true);
});

describe("platform authorization", () => {
  it("rejects an anonymous account before any data read", async () => {
    currentUser.syncCurrentUser.mockResolvedValue(null);
    await expect(service.me()).rejects.toMatchObject({ status: 401, code: "unauthenticated" });
    expect(repo.isPlatformAdmin).not.toHaveBeenCalled();
  });
  it("does not inherit Market admin or editable metadata permissions", async () => {
    expect(await service.me()).toEqual({ subject, display_name: "Account A", platform_permissions: [] });
    await expect(service.adminOverview()).rejects.toMatchObject({ status: 403 });
    expect(repo.listUsers).not.toHaveBeenCalled();
  });
  it("accepts only the persisted platform administrator grant", async () => {
    repo.isPlatformAdmin.mockResolvedValue(true);
    expect((await service.me()).platform_permissions).toEqual(["platform.admin"]);
    await service.adminOverview(); expect(repo.listUsers).toHaveBeenCalledTimes(1);
  });
  it("does not query platform tables when disabled", async () => {
    service = new PlatformService(currentUser, repo, () => false);
    await expect(service.apps()).rejects.toMatchObject({ status: 503, code: "platform_disabled" });
    expect(repo.listApps).not.toHaveBeenCalled();
  });
  it("keeps the current Auth UUID and never selects another account's grants", async () => {
    await service.apps();
    expect(repo.listAccess).toHaveBeenCalledWith(subject);
    currentUser.syncCurrentUser.mockResolvedValue({ authUserId: other, displayName: "Account B" });
    expect((await service.me()).subject).toBe(other);
    await service.apps(); expect(repo.listAccess).toHaveBeenLastCalledWith(other);
  });
  it("does not grant an explicit application when no access row exists", async () => {
    const value = await service.access("orion");
    expect(value.access).toBe("none"); expect(value.launch_path).toBeNull(); expect(value.paid_operations_enabled).toBe(false);
  });
  it("allows the explicit free Market policy without inventing per-user rows", async () => {
    expect((await service.access("market")).launch_path).toBe("/dashboard");
    expect(repo.changeAccess).not.toHaveBeenCalled();
  });
  it("does not open ORION even if its row and grant are changed to enabled", () => {
    const value = appView({ ...orion, state: "available", internal_path: "/orion" }, { auth_user_id: subject, app_id: "orion", status: "enabled", app_role: "app_admin", policy_version: 5 });
    expect(value.display_state).toBe("coming_soon"); expect(value.launch_path).toBeNull(); expect(value.limits).toBeNull();
    expect(value.paid_operations_enabled).toBe(false);
  });
  it("never launches a database-supplied external URL", () => {
    expect(appView({ ...market, internal_path: "//external.invalid" }, null).launch_path).toBeNull();
  });
  it("preserves unavailable state", () => {
    expect(appView({ ...market, state: "unavailable" }, null).display_state).toBe("unavailable");
  });
  it("rejects a direct mutation by a normal user", async () => {
    await expect(service.changeAccess({}, "request")).rejects.toMatchObject({ status: 403 });
    expect(repo.changeAccess).not.toHaveBeenCalled();
  });
  it("uses the verified actor, not an identity supplied by the caller", async () => {
    repo.isPlatformAdmin.mockResolvedValue(true);
    const input = { subject: other, app_id: "orion", status: "enabled", app_role: "user", expected_policy_version: 0, reason: "Test invitation" };
    await service.changeAccess(input, "request-id");
    expect(repo.changeAccess).toHaveBeenCalledWith(subject, input, "request-id");
    await expect(service.changeAccess({ ...input, actor: other }, "request-id")).rejects.toMatchObject({ status: 400 });
  });
  it.each(["admin", "platform_admin", "superuser"])("does not accept %s as an application role", async role => {
    repo.isPlatformAdmin.mockResolvedValue(true);
    await expect(service.changeAccess({ subject: other, app_id: "orion", status: "enabled", app_role: role, expected_policy_version: 0, reason: "Invalid role test" }, "request")).rejects.toMatchObject({ status: 400 });
  });
});
