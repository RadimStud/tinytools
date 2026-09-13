import { randomUUID } from "node:crypto";
import { createLocalJWKSet, decodeProtectedHeader, exportJWK, importJWK, jwtVerify, SignJWT, type JWK } from "jose";
import { z } from "zod";
import { assertionSchema, CLOCK_SKEW_SECONDS, CONTRACT, digest, TOKEN_SECONDS, type Assertion, type GatewaySession } from "./contract";

const publicKey = z.object({ kty: z.literal("EC"), crv: z.literal("P-256"), x: z.string(), y: z.string(),
  kid: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/), alg: z.literal("ES256"), use: z.literal("sig"),
}).strict();
export function publicKeys(input: unknown) {
  const jwks = z.object({ keys: z.array(publicKey).min(1).max(3) }).strict().parse(input);
  if (new Set(jwks.keys.map(k => k.kid)).size !== jwks.keys.length) throw new Error("Duplicate signing key IDs.");
  return jwks;
}
export type PublicKeys = ReturnType<typeof publicKeys>;
export async function tokenSigner(privateJwk: JWK, jwks: PublicKeys, issuer: string) {
  if (!issuer || issuer.length > 200) throw new Error("Issuer is required.");
  const keyset = publicKeys(jwks);
  const published = keyset.keys.find(key => key.kid === privateJwk.kid);
  if (!published || !privateJwk.d || privateJwk.alg !== "ES256" || privateJwk.kty !== "EC" || privateJwk.crv !== "P-256") throw new Error("Signing key is not configured.");
  const key = await importJWK(privateJwk, "ES256", { extractable: true });
  const exported = await exportJWK(key);
  if (exported.x !== published.x || exported.y !== published.y) throw new Error("Signing key does not match published key.");
  return async (input: { session: GatewaySession; policyVersion: number; method: "GET" | "POST";
    path: string; body: string; requestId: string; idempotencyKey: string | null; now?: number }) => {
    const now = input.now ?? Math.floor(Date.now() / 1000);
    const claims = assertionSchema.parse({ iss: issuer, aud: "orion", sub: input.session.subject, sid: input.session.sessionId,
      iat: now, exp: now + TOKEN_SECONDS, jti: randomUUID(), request_id: input.requestId,
      app_id: "orion", permissions: ["orion.use"], policy_version: input.policyVersion, v: CONTRACT,
      htm: input.method, htu: input.path, body_sha256: digest(input.body), idempotency_key: input.idempotencyKey,
    });
    return new SignJWT(claims).setProtectedHeader({ alg: "ES256", kid: published.kid, typ: "minikit-service+jwt" }).sign(key);
  };
}

/** Reference verifier. The caller must supply a trusted keyset and an ATOMIC shared replay store. */
export function serviceVerifier(jwks: PublicKeys, issuer: string,
  consume: (jti: string, expiresAt: number) => Promise<boolean>) {
  const keyset = createLocalJWKSet(publicKeys(jwks));
  return async (token: string, binding: { method: string; path: string; body: string; idempotencyKey: string | null; now?: Date }): Promise<Assertion> => {
    if (token.length > 4096) throw new Error("Invalid service assertion.");
    const header = decodeProtectedHeader(token);
    if (header.alg !== "ES256" || header.typ !== "minikit-service+jwt" || typeof header.kid !== "string" ||
      Object.keys(header).some(k => !["alg", "typ", "kid"].includes(k))) throw new Error("Invalid service assertion.");
    const { payload } = await jwtVerify(token, keyset, { algorithms: ["ES256"], issuer, audience: "orion",
      typ: "minikit-service+jwt", clockTolerance: CLOCK_SKEW_SECONDS, maxTokenAge: TOKEN_SECONDS,
      currentDate: binding.now, requiredClaims: Object.keys(assertionSchema.shape),
    });
    const c = assertionSchema.parse(payload);
    const now = Math.floor((binding.now?.getTime() ?? Date.now()) / 1000);
    if (c.exp - c.iat !== TOKEN_SECONDS || c.iat > now + CLOCK_SKEW_SECONDS || c.htm !== binding.method ||
      c.htu !== binding.path || c.body_sha256 !== digest(binding.body) || c.idempotency_key !== binding.idempotencyKey) throw new Error("Invalid service assertion.");
    if (!await consume(c.jti, c.exp + CLOCK_SKEW_SECONDS)) throw new Error("Replayed service assertion.");
    return c;
  };
}
