import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { login, logout, requestPasswordReset, signup, updatePassword } from "./actions";
const mocks = vi.hoisted(() => ({ signin: vi.fn(), signup: vi.fn(), reset: vi.fn(), update: vi.fn(), signout: vi.fn(), sync: vi.fn(), user: vi.fn(), headers: vi.fn(), revalidate: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT ${path}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("@/server/services", () => ({ services: { auth: { syncCurrentUser: mocks.sync, getAuthenticatedUser: mocks.user } } }));
vi.mock("@/infrastructure/supabase/server-client", () => ({ createSupabaseServerClient: async () => ({ auth: { signInWithPassword: mocks.signin, signUp: mocks.signup, resetPasswordForEmail: mocks.reset, updateUser: mocks.update, signOut: mocks.signout } }) }));
const form = (values: Record<string, string>) => { const data = new FormData(); for (const [k,v] of Object.entries(values)) data.set(k,v); return data; };
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("MINIKIT_PLATFORM_ENABLED", "1"); vi.stubEnv("AUTH_ALLOWED_ORIGINS", "");
  mocks.headers.mockResolvedValue(new Headers({ origin: "http://localhost:3000" }));
  mocks.signin.mockResolvedValue({ error: null }); mocks.signout.mockResolvedValue({ error: null });
  mocks.sync.mockResolvedValue({ authUserId: "verified-user" }); mocks.user.mockResolvedValue({ id: "verified-user" });
  mocks.update.mockResolvedValue({ error: null }); mocks.reset.mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllEnvs());
describe("account actions with a mocked auth provider (not live Supabase)", () => {
  it("uses an approved next destination after login and invalidates the router", async () => {
    await expect(login(form({ email: " test@example.invalid ", password: "synthetic-password", next: "/apps" }))).rejects.toThrow("REDIRECT /auth/complete?next=%2Fapps");
    expect(mocks.signin).toHaveBeenCalledWith({ email: "test@example.invalid", password: "synthetic-password" });
    expect(mocks.revalidate).toHaveBeenCalledWith("/", "layout");
  });
  it("keeps the legacy dashboard landing when disabled", async () => {
    vi.stubEnv("MINIKIT_PLATFORM_ENABLED", "");
    await expect(login(form({ email: "test@example.invalid", password: "synthetic-password" }))).rejects.toThrow("REDIRECT /dashboard");
  });
  it("rejects an external next even after successful sign-in", async () => {
    await expect(login(form({ next: "//external.invalid" }))).rejects.toThrow("REDIRECT /auth/complete?next=%2Fapps");
  });
  it("does not copy an upstream auth error into the URL", async () => {
    mocks.signin.mockResolvedValue({ error: { message: "private-token" } });
    const error = await login(form({})).catch(reason => reason as Error);
    expect(error.message).toContain("REDIRECT /login?"); expect(error.message).not.toContain("private-token");
    expect(mocks.sync).not.toHaveBeenCalled();
  });
  it("registration sends display name only, never injected roles", async () => {
    mocks.signup.mockResolvedValue({ data: { session: null }, error: null });
    await expect(signup(form({ email: "a@example.invalid", password: "synthetic-password", displayName: "Account A", role: "admin", next: "/apps" }))).rejects.toThrow("REDIRECT /signup/check-email?");
    expect(mocks.signup.mock.calls[0][0].options.data).toEqual({ display_name: "Account A" });
    expect(mocks.signup.mock.calls[0][0].options.emailRedirectTo).toBe("http://localhost:3000/auth/callback?next=%2Fapps");
  });
  it("does not send an email to a callback on an unknown origin", async () => {
    mocks.headers.mockResolvedValue(new Headers({ origin: "https://external.invalid" }));
    await expect(requestPasswordReset(form({ email: "a@example.invalid" }))).rejects.toThrow("recovery");
    expect(mocks.reset).not.toHaveBeenCalled();
  });
  it("recovery uses the fixed password destination and a non-enumerating response", async () => {
    mocks.reset.mockRejectedValue(new Error("account does not exist"));
    await expect(requestPasswordReset(form({ email: "a@example.invalid" }))).rejects.toThrow("REDIRECT /forgot-password?sent=1");
    expect(mocks.reset).toHaveBeenCalledWith("a@example.invalid", { redirectTo: "http://localhost:3000/auth/callback?next=%2Faccount%2Fpassword" });
  });
  it("password updates require a verified user", async () => {
    mocks.user.mockResolvedValue(null);
    await expect(updatePassword(form({ password: "new-password", confirmation: "new-password" }))).rejects.toThrow("REDIRECT /login");
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("changes matching passwords and uses the invalidation transition", async () => {
    await expect(updatePassword(form({ password: "new-password", confirmation: "new-password" }))).rejects.toThrow("REDIRECT /auth/complete?");
    expect(mocks.update).toHaveBeenCalledWith({ password: "new-password" });
  });
  it("logout explicitly requests global revocation", async () => {
    await expect(logout()).rejects.toThrow("REDIRECT /auth/complete?next=%2F");
    expect(mocks.signout).toHaveBeenCalledWith({ scope: "global" });
  });
  it("does not pretend a failed logout succeeded", async () => {
    mocks.signout.mockRejectedValue(new Error("private-token"));
    await expect(logout()).rejects.toThrow("REDIRECT /account?error=");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
