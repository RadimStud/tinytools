import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { OrionGateway } from "./gateway";
import { gatewayConfig, matchesServiceCredential } from "./config";
import { boundedText, operationRoute } from "./contract";
import { PlatformError } from "../domain/platform";

const a = "11111111-1111-4111-8111-111111111111";
const b = "22222222-2222-4222-8222-222222222222";
const origin = "http://127.0.0.1:3100";
const context = (subject = a) => ({ app_id: "orion", subject, policy_version: 1, permissions: ["orion.use"], mode: "contract-test", limits: null, paid_operations_enabled: false });
const request = (path = "/v1/context", init: RequestInit = {}) => new Request(origin + "/api/apps/orion" + path, init);
function setup() {
  const deps = { session: vi.fn(async () => ({ subject: a, sessionId: b })),
    policy: { authorize: vi.fn(async () => ({ policy_version: 1 })), admit: vi.fn(async () => {}) },
    sign: vi.fn(async () => "server-only-assertion"), origin, upstream: "http://127.0.0.1:4201", timeoutMs: 15,
    fetcher: vi.fn<typeof fetch>(async () => Response.json(context())),
  };
  return { deps, gateway: new OrionGateway(deps) };
}
describe("fixed-target gateway", () => {
  it("ignores spoofed identity, cookies, forwarded hosts and browser authorization upstream", async () => {
    const { deps, gateway } = setup();
    await gateway.handle(request("/v1/context", { headers: { "x-user-id": b, authorization: "Bearer attacker", cookie: "private-session", "x-forwarded-host": "evil.invalid" } }), randomUUID());
    const [target, init] = deps.fetcher.mock.calls[0]; const h = new Headers(init?.headers);
    expect(target).toBe(deps.upstream + "/v1/context"); expect(init?.redirect).toBe("manual");
    expect(h.get("authorization")).toBe("Bearer server-only-assertion");
    for (const name of ["cookie", "x-user-id", "x-forwarded-host"]) expect(h.has(name)).toBe(false);
    expect(deps.sign.mock.calls).toHaveLength(1);
  });
  it("does not send requests without an authenticated account", async () => {
    const { deps } = setup();
    const gateway = new OrionGateway({ ...deps, session: async () => null });
    await expect(gateway.handle(request(), randomUUID())).rejects.toMatchObject({ status: 401 });
    expect(deps.fetcher).not.toHaveBeenCalled();
  });
  it.each(["/v1/context?url=https://evil.invalid", "/v1/%2fcontext", "/v1/unknown"])("rejects target manipulation %s", async path => {
    const { gateway, deps } = setup(); await expect(gateway.handle(request(path), randomUUID())).rejects.toMatchObject({ status: 404 }); expect(deps.fetcher).not.toHaveBeenCalled();
  });
  it.each(["PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])("denies method %s", method => { expect(() => operationRoute(method, "/v1/context")).toThrow(); });
  it.each([
    ["https://evil.invalid", { operation: "contract.echo", input: { text: "ok" } }, "origin_rejected"],
    [origin, { operation: "contract.echo", input: { text: "ok" }, subject: b }, "invalid_request"],
    [origin, { operation: "chat.respond", input: {} }, "paid_operations_disabled"],
  ])("rejects unsupported mutation case %#", async (from, body, code) => {
    const { gateway, deps } = setup();
    await expect(gateway.handle(request("/v1/jobs", { method: "POST", headers: { Origin: from, "Content-Type": "application/json", "Idempotency-Key": randomUUID() }, body: JSON.stringify(body) }), randomUUID())).rejects.toMatchObject({ code });
    expect(deps.fetcher).not.toHaveBeenCalled();
  });
  it("does not follow upstream redirects or forward error diagnostics", async () => {
    const { gateway, deps } = setup();
    deps.fetcher.mockResolvedValue(new Response("secret", { status: 302, headers: { Location: "http://metadata.invalid" } }));
    await expect(gateway.handle(request(), randomUUID())).rejects.toMatchObject({ code: "app_unavailable" });
  });
  it.each([new Response("X".repeat(65537), { headers: { "Content-Type": "application/json" } }), Response.json(context(b)), Response.json({ ...context(), secret: "token" }), new Response("not json")])(
    "rejects oversized, wrong-owner or invalid responses %#", async response => {
      const { gateway, deps } = setup(); deps.fetcher.mockResolvedValue(response);
      await expect(gateway.handle(request(), randomUUID())).rejects.toMatchObject({ code: "invalid_app_response" });
    });
  it("enforces timeout while the response body is streaming", async () => {
    const { gateway, deps } = setup();
    deps.fetcher.mockResolvedValue(new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('{')); } }), { headers: { "Content-Type": "application/json" } }));
    await expect(gateway.handle(request(), randomUUID())).rejects.toMatchObject({ status: 504 });
  });
  it("rechecks permission before returning a running operation's result", async () => {
    const { gateway, deps } = setup();
    deps.policy.authorize.mockResolvedValueOnce({ policy_version: 1 }).mockResolvedValueOnce({ policy_version: 1 }).mockRejectedValueOnce(new PlatformError(403, "access_denied"));
    await expect(gateway.handle(request(), randomUUID())).rejects.toMatchObject({ status: 403 });
  });
  it("enforces the actual streaming request limit", async () => {
    await expect(boundedText(new Blob(["x".repeat(33_000)]).stream(), 32_768)).rejects.toMatchObject({ status: 413 });
  });
  it("fails closed without explicit nonproduction configuration", () => {
    expect(() => gatewayConfig({})).toThrow();
    expect(() => gatewayConfig({ MINIKIT_PLATFORM_ENABLED: "1", MINIKIT_ORION_GATEWAY_MODE: "contract-test", MINIKIT_DEPLOYMENT_ENV: "staging", VERCEL_ENV: "production" })).toThrow();
    expect(matchesServiceCredential("Bearer x", "x".repeat(32))).toBe(false);
    expect(matchesServiceCredential("Bearer " + "x".repeat(32), "x".repeat(32))).toBe(true);
  });
});
