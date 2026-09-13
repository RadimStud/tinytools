/** Isolated contract fixture, NOT the ORION application. Bind loopback only. Never deploy. */
import { createServer } from "node:http";
import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import { serviceVerifier, publicKeys } from "../../src/modules/platform/gateway/service-token";
import { BODY_LIMIT, boundedText, digest, jobInput, operationRoute } from "../../src/modules/platform/gateway/contract";
import { matchesServiceCredential } from "../../src/modules/platform/gateway/config";

if (process.env.MINIKIT_DEPLOYMENT_ENV !== "isolated-test") throw new Error("Isolated contract fixture only.");
const seen = new Map<string, number>();
const verify = serviceVerifier(publicKeys(JSON.parse(process.env.MINIKIT_IDENTITY_PUBLIC_JWKS!)), process.env.MINIKIT_IDENTITY_ISSUER!, async (id, exp) => {
  const now = Date.now() / 1000;
  for (const [key, expiry] of seen) if (expiry <= now) seen.delete(key);
  if (seen.has(id) || seen.size > 5000) return false;
  seen.set(id, exp); return true;
});
type Job = { id: string; subject: string; state: "queued" | "completed"; operation: "contract.echo";
  output: { text: string } | null; policy_version: number; text: string };
const jobs = new Map<string, Job>();
const idempotency = new Map<string, { hash: string; id: string }>();
let fault = "";
const server = createServer(async (req, res) => {
  const send = (status: number, body: unknown) => { res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(body)); };
  try {
    const path = req.url ?? "";
    if (path === "/health") { send(200, { status: "ok" }); return; }
    if (path === "/__control" && req.method === "POST") {
      if (!matchesServiceCredential(req.headers.authorization ?? null, process.env.ORION_SERVICE_CREDENTIAL!)) { send(401, {}); return; }
      fault = await boundedText(Readable.toWeb(req) as ReadableStream<Uint8Array>, 100);
      send(200, { status: "ok" }); return;
    }
    let route;
    try { route = operationRoute(req.method ?? "", path); } catch { send(404, { error: "not_found" }); return; }
    const body = await boundedText(Readable.toWeb(req) as ReadableStream<Uint8Array>, BODY_LIMIT);
    const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
    let claims;
    try { claims = await verify(token, { method: req.method!, path, body, idempotencyKey: typeof req.headers["idempotency-key"] === "string" ? req.headers["idempotency-key"] : null }); }
    catch { send(401, { error: "invalid_service_identity" }); return; }
    // Re-authorize queued work and direct service calls against live platform policy/session.
    // This fixture never performs paid work. P3 reservations are NOT implemented here.
    const authorization = await fetch(process.env.MINIKIT_PLATFORM_ORIGIN + "/api/platform/v1/internal/orion/authorize", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.ORION_SERVICE_CREDENTIAL },
      body: JSON.stringify({ subject: claims.sub, session_id: claims.sid, policy_version: claims.policy_version,
        operation_id: claims.request_id, operation: "contract.echo" }), signal: AbortSignal.timeout(3000), redirect: "error",
    });
    if (!authorization.ok) { send(authorization.status, { error: "authorization_rejected" }); return; }
    if (fault === "timeout") { setTimeout(() => { if (!res.destroyed) send(200, {}); }, 6000); return; }
    if (fault === "redirect") { res.writeHead(302, { Location: "http://169.254.169.254/" }); res.end(); return; }
    if (fault === "oversize") { send(200, { data: "x".repeat(70_000) }); return; }
    if (fault === "down") { send(500, { secret: "internal-diagnostic-do-not-relay" }); return; }
    if (route.kind === "context") {
      send(200, { app_id: "orion", subject: claims.sub, policy_version: claims.policy_version, permissions: ["orion.use"], mode: "contract-test", limits: null, paid_operations_enabled: false }); return;
    }
    if (route.kind === "create") {
      const input = jobInput.parse(JSON.parse(body));
      const key = claims.sub + ":" + claims.idempotency_key;
      const previous = idempotency.get(key);
      if (previous && previous.hash !== digest(body)) { send(409, { error: "idempotency_conflict" }); return; }
      if (jobs.size >= 1000 && !previous) { send(429, { error: "fixture_capacity" }); return; }
      const job: Job = previous ? jobs.get(previous.id)! : { id: randomUUID(), subject: claims.sub, state: "queued", operation: "contract.echo", output: null, policy_version: claims.policy_version, text: input.input.text };
      jobs.set(job.id, job); idempotency.set(key, { id: job.id, hash: digest(body) });
      const { text: ignored, ...view } = job; void ignored; send(200, view); return;
    }
    const id = path.split("/")[3]; const job = jobs.get(id);
    if (!job || job.subject !== claims.sub) { send(404, { error: "job_not_found" }); return; }
    if (route.kind === "run") { job.state = "completed"; job.output = { text: job.text }; job.policy_version = claims.policy_version; }
    const { text: ignored, ...view } = job; void ignored; send(200, view);
  } catch { if (!res.headersSent) send(503, { error: "fixture_unavailable" }); else res.destroy(); }
});
server.listen(4201, "127.0.0.1");
