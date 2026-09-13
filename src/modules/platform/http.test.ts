import { afterEach, describe, expect, it, vi } from "vitest";
import { platformResponse, readPlatformMutation } from "./http";
import { PlatformError } from "./domain/platform";
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
function request(body = "{}", headers: Record<string, string> = {}) {
  return new Request("https://portal.example.invalid/api/platform/v1/admin/access", { method: "PUT", headers: { Origin: "https://portal.example.invalid", "Content-Type": "application/json", ...headers }, body });
}
describe("platform HTTP boundary", () => {
  it("does not cache personalized data and generates its own request ID", async () => {
    const response = await platformResponse(async () => ({ subject: "test-subject" }));
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toBe("Cookie");
    expect((await response.json()).request_id).toMatch(/^[0-9a-f-]{36}$/);
  });
  it("redacts unexpected errors in response and logs", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await platformResponse(async () => { throw new Error("database-password-secret"); });
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("password");
    expect(JSON.stringify(log.mock.calls)).not.toContain("password");
  });
  it("returns stable authenticated API errors instead of redirect HTML", async () => {
    const response = await platformResponse(async () => { throw new PlatformError(401, "unauthenticated"); });
    expect(response.status).toBe(401); expect((await response.json()).error.code).toBe("unauthenticated");
  });
  it("requires configured same-origin JSON for mutations", async () => {
    vi.stubEnv("MINIKIT_PLATFORM_ORIGIN", "https://portal.example.invalid");
    expect(await readPlatformMutation(request('{"status":"enabled"}'))).toEqual({ status: "enabled" });
    await expect(readPlatformMutation(request("{}", { Origin: "https://other.invalid" }))).rejects.toMatchObject({ code: "origin_rejected" });
    await expect(readPlatformMutation(request("{}", { "Sec-Fetch-Site": "cross-site" }))).rejects.toMatchObject({ status: 403 });
  });
  it("rejects unconfigured origin and wrong content type", async () => {
    vi.stubEnv("MINIKIT_PLATFORM_ORIGIN", "");
    await expect(readPlatformMutation(request())).rejects.toMatchObject({ status: 503 });
    vi.stubEnv("MINIKIT_PLATFORM_ORIGIN", "https://portal.example.invalid");
    await expect(readPlatformMutation(request("{}", { "Content-Type": "text/plain" }))).rejects.toMatchObject({ status: 415 });
  });
  it("enforces body limits even without Content-Length", async () => {
    vi.stubEnv("MINIKIT_PLATFORM_ORIGIN", "https://portal.example.invalid");
    await expect(readPlatformMutation(request("x".repeat(9000)))).rejects.toMatchObject({ status: 413 });
    await expect(readPlatformMutation(request("{}", { "Content-Length": "9000" }))).rejects.toMatchObject({ status: 413 });
  });
  it("does not accept malformed JSON", async () => {
    vi.stubEnv("MINIKIT_PLATFORM_ORIGIN", "https://portal.example.invalid");
    await expect(readPlatformMutation(request("{"))).rejects.toMatchObject({ status: 400 });
  });
});
