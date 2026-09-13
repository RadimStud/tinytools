import { afterEach, expect, it, vi } from "vitest";
import { authCompletionPath } from "./auth-completion";
afterEach(() => vi.unstubAllEnvs());
it("preserves old landing without activation", () => { vi.stubEnv("MINIKIT_PLATFORM_ENABLED", ""); expect(authCompletionPath(null)).toBe("/dashboard"); });
it("uses an invalidation transition only after activation", () => { vi.stubEnv("MINIKIT_PLATFORM_ENABLED", "1"); expect(authCompletionPath("/apps")).toBe("/auth/complete?next=%2Fapps"); });
it.each(["//evil.invalid", "/api/platform/v1/me", "/%2foutside", "/dashboard/../apps"])("revalidates return target %s", value => { vi.stubEnv("MINIKIT_PLATFORM_ENABLED", "1"); expect(authCompletionPath(value)).toBe("/auth/complete?next=%2Fapps"); });
