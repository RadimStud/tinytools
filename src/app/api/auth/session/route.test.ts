import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GET } from "./route";
const mocks = vi.hoisted(() => ({ user: vi.fn() }));
vi.mock("@/server/services", () => ({ services: { auth: { getAuthenticatedUser: mocks.user } } }));
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("MINIKIT_PLATFORM_ENABLED", "1"); });
afterEach(() => vi.unstubAllEnvs());
it("returns only the verified UUID, not cookies or user metadata", async () => {
  mocks.user.mockResolvedValue({ id: "verified-id", email: "not-returned@example.invalid", user_metadata: { role: "admin" } });
  const response = await GET();
  expect(await response.json()).toEqual({ data: { subject: "verified-id" } });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
it("rejects anonymous sessions", async () => { mocks.user.mockResolvedValue(null); expect((await GET()).status).toBe(401); });
it("does not contact auth when the feature is disabled", async () => { vi.stubEnv("MINIKIT_PLATFORM_ENABLED", ""); expect((await GET()).status).toBe(404); expect(mocks.user).not.toHaveBeenCalled(); });
it("does not expose upstream failures", async () => { mocks.user.mockRejectedValue(new Error("private-token")); const response = await GET(); expect(response.status).toBe(503); expect(await response.text()).not.toContain("private-token"); });
