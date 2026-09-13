import { beforeEach, describe, expect, it, vi } from "vitest";
import { PUT } from "./route";
import { PlatformError } from "@/modules/platform/domain/platform";
const mocks = vi.hoisted(() => ({ me: vi.fn(), changeAccess: vi.fn() }));
vi.mock("@/server/platform-services", () => ({ platformService: async () => mocks }));
beforeEach(() => { vi.resetAllMocks(); });
describe("admin access endpoint", () => {
  it("rejects anonymous requests before reading their body", async () => {
    mocks.me.mockRejectedValue(new PlatformError(401, "unauthenticated"));
    const response = await PUT(new Request("https://minikit.invalid/api/platform/v1/admin/access", { method: "PUT", body: "bad JSON" }));
    expect(response.status).toBe(401); expect(mocks.changeAccess).not.toHaveBeenCalled();
  });
  it("does not accept a forged admin identity header", async () => {
    mocks.me.mockResolvedValue({ subject: "verified-account", platform_permissions: [] });
    const response = await PUT(new Request("https://minikit.invalid/api/platform/v1/admin/access", { method: "PUT", headers: { "X-User-Id": "administrator", "X-Role": "platform.admin" }, body: "{}" }));
    expect(response.status).toBe(403); expect(mocks.changeAccess).not.toHaveBeenCalled();
  });
});
