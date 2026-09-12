import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({ exchange: vi.fn(), sync: vi.fn(), client: vi.fn() }));
vi.mock("@/infrastructure/supabase/server-client", () => ({ createSupabaseServerClient: mocks.client }));
vi.mock("@/server/services", () => ({ services: { auth: { syncCurrentUser: mocks.sync } } }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.client.mockResolvedValue({ auth: { exchangeCodeForSession: mocks.exchange } });
  mocks.exchange.mockResolvedValue({ error: null });
  mocks.sync.mockResolvedValue({ id: "test-user" });
});
afterEach(() => { vi.restoreAllMocks(); });

function request(query: string) {
  return new NextRequest(`https://tinytools-ten.vercel.app/auth/callback?${query}`);
}

describe("authentication callback", () => {
  it.each(["//external.invalid", "/\\external.invalid", "https://external.invalid", "/%2fexternal.invalid"])(
    "does not redirect a successful login to %s", async (next) => {
      const response = await GET(request(`code=test-code&next=${encodeURIComponent(next)}`));
      expect(response.headers.get("location")).toBe("https://tinytools-ten.vercel.app/dashboard");
      expect(response.headers.get("cache-control")).toBe("private, no-store");
    },
  );

  it("keeps a valid local destination and exchanges the code once", async () => {
    const response = await GET(request("code=test-code&next=%2Fdashboard%3Fcreated%3D1"));
    expect(response.headers.get("location")).toBe("https://tinytools-ten.vercel.app/dashboard?created=1");
    expect(mocks.exchange).toHaveBeenCalledTimes(1);
    expect(mocks.exchange).toHaveBeenCalledWith("test-code");
    expect(mocks.sync).toHaveBeenCalledTimes(1);
  });

  it("does not contact auth when the code is missing", async () => {
    const response = await GET(request("next=%2F%2Fexternal.invalid"));
    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it("does not expose an upstream auth error in the redirect", async () => {
    mocks.exchange.mockResolvedValue({ error: { message: "private-token-do-not-expose" } });
    const response = await GET(request("code=test-code"));
    expect(response.headers.get("location")).not.toContain("private-token");
    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
    expect(mocks.sync).not.toHaveBeenCalled();
  });

  it("requires an authenticated application user after exchange", async () => {
    mocks.sync.mockResolvedValue(null);
    const response = await GET(request("code=test-code"));
    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
  });

  it("redacts unexpected failures from both response and log", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.sync.mockRejectedValue(new Error("postgresql://private:password@database"));
    const response = await GET(request("code=secret-code"));
    expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith("Authentication callback failed.");
    expect(response.headers.get("location")).not.toContain("password");
  });
});
