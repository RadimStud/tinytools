import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/infrastructure/db/client", () => ({ sql: mocks.query }));
beforeEach(() => { vi.resetAllMocks(); });
afterEach(() => { vi.restoreAllMocks(); });

describe("public database health", () => {
  it("reports a successful probe without caching the response", async () => {
    mocks.query.mockResolvedValue([{ now: "2026-09-12T00:00:00.000Z" }]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      service: "tinytools-database", status: "ok", databaseTime: "2026-09-12T00:00:00.000Z",
    });
  });

  it("returns 503 without leaking database details to the browser or log", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.query.mockRejectedValue(new Error("password secret; postgresql://user:pass@internal-db; select from users"));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      service: "tinytools-database", status: "error", message: "Database temporarily unavailable.",
    });
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith("Database health probe failed.");
  });

  it("does not report success for an empty probe result", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.query.mockResolvedValue([]);
    expect((await GET()).status).toBe(503);
  });
});
