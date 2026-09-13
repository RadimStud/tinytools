import { NextRequest } from "next/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { updateSupabaseSession } from "./proxy";
const mocks = vi.hoisted(() => ({ claims: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => ({ auth: { getClaims: mocks.claims } }) }));
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv("MINIKIT_PLATFORM_ENABLED", "1"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "synthetic-test-key"); });
afterEach(() => vi.unstubAllEnvs());
it("preserves an approved deep link for an anonymous request", async () => {
  mocks.claims.mockResolvedValue({ data: null, error: null });
  const path = "/dashboard/tools/11111111-1111-4111-8111-111111111111?saved=1";
  const result = await updateSupabaseSession(new NextRequest("http://localhost:3000" + path, { headers: { "x-user-id": "forged", "x-next": "//external.invalid" } }));
  const target = new URL(result.headers.get("location")!);
  expect(target.pathname).toBe("/login"); expect(target.searchParams.get("next")).toBe(path);
});
it("does not turn an unknown private subpath into an arbitrary return URL", async () => {
  mocks.claims.mockResolvedValue({ data: null, error: null });
  const result = await updateSupabaseSession(new NextRequest("http://localhost:3000/platform/unknown"));
  expect(new URL(result.headers.get("location")!).searchParams.get("next")).toBe("/apps");
});
it("leaves actual authorization to the page when claims exist", async () => {
  mocks.claims.mockResolvedValue({ data: { claims: { sub: "verified-subject" } }, error: null });
  expect((await updateSupabaseSession(new NextRequest("http://localhost:3000/admin"))).headers.get("location")).toBeNull();
});
it("does not change the old redirect behavior while platform is disabled", async () => {
  vi.stubEnv("MINIKIT_PLATFORM_ENABLED", ""); mocks.claims.mockResolvedValue({ data: null, error: null });
  expect((await updateSupabaseSession(new NextRequest("http://localhost:3000/admin"))).headers.get("location")).toBeNull();
});
it("does not redirect public pages or JSON APIs to HTML login", async () => {
  mocks.claims.mockResolvedValue({ data: null, error: null });
  for (const path of ["/workbench/csv-cleaner", "/api/platform/v1/me", "/auth/callback"]) expect((await updateSupabaseSession(new NextRequest("http://localhost:3000" + path))).headers.get("location")).toBeNull();
});
