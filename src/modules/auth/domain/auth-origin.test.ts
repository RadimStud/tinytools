import { afterEach, describe, expect, it, vi } from "vitest";
import { authOrigin } from "./auth-origin";
afterEach(() => { vi.unstubAllEnvs(); });
describe("auth callback origins", () => {
  it("retains the existing production and development origins", () => {
    vi.stubEnv("AUTH_ALLOWED_ORIGINS", "");
    expect(authOrigin("http://localhost:3000")).toBe("http://localhost:3000");
    expect(authOrigin("https://tinytools-ten.vercel.app")).toBe("https://tinytools-ten.vercel.app");
  });
  it.each([null, "https://external.invalid", "//external.invalid", "https://tinytools-ten.vercel.app.evil.invalid"])("rejects unconfigured origin %j", value => {
    vi.stubEnv("AUTH_ALLOWED_ORIGINS", ""); expect(authOrigin(value)).toBeNull();
  });
  it("requires an explicit exact staging origin", () => {
    vi.stubEnv("AUTH_ALLOWED_ORIGINS", "https://staging.example.invalid,http://127.0.0.1:3101");
    expect(authOrigin("https://staging.example.invalid")).toBe("https://staging.example.invalid");
    expect(authOrigin("https://tinytools-ten.vercel.app")).toBeNull();
  });
  it.each(["http://remote.invalid", "https://staging.example.invalid/path", "https://user:pass@staging.example.invalid"])("rejects unsafe configuration %s", value => {
    vi.stubEnv("AUTH_ALLOWED_ORIGINS", value); expect(authOrigin(value)).toBeNull();
  });
});
