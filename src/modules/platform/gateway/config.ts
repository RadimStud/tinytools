import { timingSafeEqual } from "node:crypto";
import type { JWK } from "jose";
import { PlatformError } from "../domain/platform";
import { publicKeys, tokenSigner } from "./service-token";

export function gatewayConfig(env: Record<string, string | undefined> = process.env) {
  // P2 deliberately cannot enable the single-owner ORION or a public paid service.
  if (env.MINIKIT_PLATFORM_ENABLED !== "1" || env.MINIKIT_ORION_GATEWAY_MODE !== "contract-test" ||
    !["isolated-test", "staging"].includes(env.MINIKIT_DEPLOYMENT_ENV ?? "") || env.VERCEL_ENV === "production") {
    throw new PlatformError(503, "app_unavailable");
  }
  try {
    const origin = exactOrigin(env.MINIKIT_PLATFORM_ORIGIN ?? "", env.MINIKIT_DEPLOYMENT_ENV === "isolated-test");
    const upstream = exactOrigin(env.ORION_INTERNAL_ORIGIN ?? "", env.MINIKIT_DEPLOYMENT_ENV === "isolated-test");
    const issuer = env.MINIKIT_IDENTITY_ISSUER ?? "";
    if (!/^(?:urn:minikit:platform:[a-z0-9-]+|https:\/\/[^\s?#]+)$/.test(issuer)) throw new Error();
    const serviceCredential = env.ORION_SERVICE_CREDENTIAL ?? "";
    if (serviceCredential.length < 32 || serviceCredential.length > 128 || /\s/.test(serviceCredential)) throw new Error();
    const jwks = publicKeys(JSON.parse(env.MINIKIT_IDENTITY_PUBLIC_JWKS ?? ""));
    const privateJwk = JSON.parse(env.MINIKIT_IDENTITY_PRIVATE_JWK ?? "") as JWK;
    return { origin, upstream, issuer, serviceCredential, jwks, privateJwk, timeoutMs: 5000 };
  } catch { throw new PlatformError(503, "gateway_not_configured"); }
}
export function exactOrigin(value: string, localAllowed: boolean) {
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.origin !== value || url.username || url.password || url.search || url.hash ||
    (url.protocol !== "https:" && !(localAllowed && local && url.protocol === "http:"))) throw new Error("Invalid origin.");
  return url.origin;
}
export function matchesServiceCredential(header: string | null, expected: string): boolean {
  if (!header?.startsWith("Bearer ") || expected.length < 32) return false;
  const supplied = Buffer.from(header.slice(7)); const secret = Buffer.from(expected);
  return supplied.length === secret.length && timingSafeEqual(supplied, secret);
}
export async function configuredSigner(config: ReturnType<typeof gatewayConfig>) {
  try { return await tokenSigner(config.privateJwk, config.jwks, config.issuer); }
  catch { throw new PlatformError(503, "gateway_not_configured"); }
}
