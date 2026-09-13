import { afterEach, describe, expect, it, vi } from "vitest";
import { authRedirectOrigin } from "./auth-origin";
afterEach(() => { vi.unstubAllEnvs(); });
describe("canonical portal redirects", () => {
  it("keeps callbacks on the approved browser origin, not the reverse proxy host", () => {
    vi.stubEnv("MINIKIT_PLATFORM_ENABLED", "1");
    vi.stubEnv("MINIKIT_PLATFORM_ORIGIN", "https://portal.example.test");
    vi.stubEnv("AUTH_ALLOWED_ORIGINS", "https://portal.example.test");
    expect(authRedirectOrigin("http://localhost:3100")).toBe("https://portal.example.test");
  });
  it("does not accept an unapproved configured origin", () => {
    vi.stubEnv("MINIKIT_PLATFORM_ENABLED", "1");
    vi.stubEnv("MINIKIT_PLATFORM_ORIGIN", "https://other.example.test");
    vi.stubEnv("AUTH_ALLOWED_ORIGINS", "https://portal.example.test");
    expect(authRedirectOrigin("http://localhost:3100")).toBeNull();
  });
  it("leaves legacy platform-disabled routing unchanged", () => {
    vi.stubEnv("MINIKIT_PLATFORM_ENABLED", "0");
    expect(authRedirectOrigin("https://tinytools-ten.vercel.app")).toBe("https://tinytools-ten.vercel.app");
  });
});
