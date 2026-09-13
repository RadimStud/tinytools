import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { exportJWK, generateKeyPair, importJWK, SignJWT, type JWK } from "jose";
import { publicKeys, serviceVerifier, tokenSigner, type PublicKeys } from "./service-token";
import { CONTRACT, digest } from "./contract";

let privateJwk: JWK; let jwks: PublicKeys;
const issuer = "urn:minikit:platform:test";
const subject = "11111111-1111-4111-8111-111111111111";
const sid = "22222222-2222-4222-8222-222222222222";
const body = JSON.stringify({ operation: "contract.echo", input: { text: "Synthetic" } });
const keyId = randomUUID();
const binding = { method: "POST" as const, path: "/v1/jobs", body, idempotencyKey: keyId };
beforeAll(async () => {
  const pair = await generateKeyPair("ES256", { extractable: true });
  privateJwk = { ...await exportJWK(pair.privateKey), kid: "test-a", alg: "ES256", use: "sig" };
  jwks = publicKeys({ keys: [{ ...await exportJWK(pair.publicKey), kid: "test-a", alg: "ES256", use: "sig" }] });
});
async function issue(overrides: Record<string, unknown> = {}, header: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ iss: issuer, aud: "orion", sub: subject, sid, iat: now, exp: now + 45,
    jti: randomUUID(), request_id: randomUUID(), app_id: "orion", permissions: ["orion.use"], policy_version: 1,
    v: CONTRACT, htm: "POST", htu: "/v1/jobs", body_sha256: digest(body), idempotency_key: keyId, ...overrides,
  }).setProtectedHeader({ alg: "ES256", typ: "minikit-service+jwt", kid: "test-a", ...header })
    .sign(await importJWK(privateJwk, "ES256"));
}
const verifier = () => serviceVerifier(jwks, issuer, async () => true);
describe("service assertion contract", () => {
  it("signs stable Auth UUIDs without email, password or platform admin rights", async () => {
    const sign = await tokenSigner(privateJwk, jwks, issuer);
    const token = await sign({ ...binding, session: { subject, sessionId: sid }, policyVersion: 3, requestId: randomUUID() });
    const result = await verifier()(token, binding);
    expect(result.sub).toBe(subject); expect(result.sid).toBe(sid); expect(result.policy_version).toBe(3);
    expect(result.exp - result.iat).toBe(45); expect(result.permissions).toEqual(["orion.use"]);
    expect(result).not.toHaveProperty("email"); expect(result).not.toHaveProperty("role");
  });
  it.each([
    { iss: "urn:attacker" }, { aud: "market" }, { app_id: "market" }, { sub: "user@example.invalid" },
    { sid: undefined }, { jti: undefined }, { policy_version: 0 }, { permissions: ["platform.admin"] },
    { v: "minikit.orion/99" }, { htm: "GET" }, { htu: "/v1/jobs/other" }, { body_sha256: digest("other") },
    { idempotency_key: randomUUID() }, { exp: 1 }, { iat: 1 }, { email: "private@example.invalid" },
  ])("rejects invalid claims case %#", async bad => { await expect(verifier()(await issue(bad), binding)).rejects.toBeDefined(); });
  it.each([{ kid: "unknown" }, { typ: "JWT" }, { jku: "https://evil.invalid/keys" }, { jwk: {} }, { x5u: "https://evil.invalid" }])(
    "rejects unsupported header case %#", async header => { await expect(verifier()(await issue({}, header), binding)).rejects.toBeDefined(); });
  it("does not accept an unsigned or symmetric token", async () => {
    const token = await new SignJWT({ sub: subject }).setProtectedHeader({ alg: "HS256", kid: "test-a", typ: "minikit-service+jwt" }).sign(new Uint8Array(32));
    await expect(verifier()(token, binding)).rejects.toBeDefined();
    await expect(verifier()("e30.e30.", binding)).rejects.toBeDefined();
  });
  it("rejects a valid signature under an untrusted key", async () => {
    const pair = await generateKeyPair("ES256");
    const token = await new SignJWT({}).setProtectedHeader({ alg: "ES256", kid: "test-a", typ: "minikit-service+jwt" }).sign(pair.privateKey);
    await expect(verifier()(token, binding)).rejects.toBeDefined();
  });
  it("checks method/body/idempotency binding and consumes each assertion once", async () => {
    const seen = new Set<string>(); const verify = serviceVerifier(jwks, issuer, async id => { if (seen.has(id)) return false; seen.add(id); return true; });
    const token = await issue();
    await expect(verify(token, { ...binding, method: "GET" })).rejects.toBeDefined();
    await verify(token, binding);
    await expect(verify(token, binding)).rejects.toBeDefined();
  });
  it("caps useful lifetime at 48 seconds including clock tolerance", async () => {
    const now = Math.floor(Date.now() / 1000); const token = await issue({ iat: now, exp: now + 45 });
    await verifier()(token, { ...binding, now: new Date((now + 47) * 1000) });
    await expect(verifier()(token, { ...binding, now: new Date((now + 48) * 1000) })).rejects.toBeDefined();
    await expect(verifier()(await issue({ exp: now + 60 }), binding)).rejects.toBeDefined();
    await expect(verifier()(await issue({ iat: now + 4, exp: now + 49 }), binding)).rejects.toBeDefined();
  });
  it("supports overlapping public keys for rotation without distributing private keys", async () => {
    const pair = await generateKeyPair("ES256", { extractable: true });
    const next = { ...await exportJWK(pair.privateKey), kid: "test-b", alg: "ES256", use: "sig" };
    const publicNext = { ...await exportJWK(pair.publicKey), kid: "test-b", alg: "ES256", use: "sig" };
    const rotating = publicKeys({ keys: [...jwks.keys, publicNext] });
    const sign = await tokenSigner(next, rotating, issuer);
    const token = await sign({ ...binding, session: { subject, sessionId: sid }, policyVersion: 1, requestId: randomUUID() });
    await serviceVerifier(rotating, issuer, async () => true)(token, binding);
    await expect(verifier()(token, binding)).rejects.toBeDefined();
    expect(() => publicKeys({ keys: [next] })).toThrow();
  });
});
