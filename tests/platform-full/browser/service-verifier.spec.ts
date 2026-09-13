import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { SignJWT, importJWK } from "jose";
import { test, expect } from "@playwright/test";
import { CONTRACT, digest } from "../../../src/modules/platform/gateway/contract";

const config = JSON.parse(fs.readFileSync(".p2-local/test.json", "utf8"));
if (config.MINIKIT_DEPLOYMENT_ENV !== "isolated-test" || config.ORION_INTERNAL_ORIGIN !== "http://127.0.0.1:4201") throw new Error("Loopback contract fixture required.");
const privateJwk = JSON.parse(config.MINIKIT_IDENTITY_PRIVATE_JWK);
for (const [label, changes] of [
  ["wrong issuer", { iss: "urn:minikit:other" }],
  ["wrong audience", { aud: "market" }],
  ["wrong app", { app_id: "market" }],
  ["expired", { iat: 1, exp: 46 }],
  ["missing session", { sid: undefined }],
  ["unapproved permissions", { permissions: ["platform.admin"] }],
  ["wrong request method", { htm: "POST" }],
  ["wrong request path", { htu: "/v1/jobs" }],
  ["wrong body hash", { body_sha256: digest("changed") }],
] as const) {
  test(`running service rejects ${label} before execution authorization`, async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({ iss: config.MINIKIT_IDENTITY_ISSUER, aud: "orion", sub: randomUUID(), sid: randomUUID(),
      iat: now, exp: now + 45, jti: randomUUID(), request_id: randomUUID(), app_id: "orion", permissions: ["orion.use"],
      policy_version: 1, v: CONTRACT, htm: "GET", htu: "/v1/context", body_sha256: digest(""), idempotency_key: null, ...changes,
    }).setProtectedHeader({ alg: "ES256", kid: privateJwk.kid, typ: "minikit-service+jwt" }).sign(await importJWK(privateJwk, "ES256"));
    const response = await fetch(config.ORION_INTERNAL_ORIGIN + "/v1/context", { headers: { Authorization: `Bearer ${token}` } });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "invalid_service_identity" });
  });
}

test("running service refuses an unverified identity header without a token", async () => {
  const response = await fetch(config.ORION_INTERNAL_ORIGIN + "/v1/context", { headers: { "X-User-Id": randomUUID() } });
  expect(response.status).toBe(401); expect(await response.json()).toEqual({ error: "invalid_service_identity" });
});
