import { z } from "zod";
import { PlatformError } from "../domain/platform";
import { BODY_LIMIT, boundedText, contextResult, jobInput, jobResult, operationRoute, RESPONSE_LIMIT, uuid, type GatewaySession } from "./contract";
import type { GatewayPolicyRepository } from "./repository";
import type { tokenSigner } from "./service-token";

type Signer = Awaited<ReturnType<typeof tokenSigner>>;
export class OrionGateway {
  constructor(private readonly dependencies: {
    session: () => Promise<GatewaySession | null>; policy: GatewayPolicyRepository;
    sign: Signer; origin: string; upstream: string; timeoutMs?: number; fetcher?: typeof fetch;
  }) {}
  async handle(request: Request, requestId: string) {
    const url = new URL(request.url);
    const prefix = "/api/apps/orion";
    if (url.search || !url.pathname.startsWith(prefix + "/") || /[%\\]/.test(url.pathname)) throw new PlatformError(404, "operation_not_supported");
    const route = operationRoute(request.method, url.pathname.slice(prefix.length));
    const session = await this.dependencies.session();
    if (!session) throw new PlatformError(401, "unauthenticated");
    await this.dependencies.policy.authorize(session);
    let body = ""; let idempotencyKey: string | null = null;
    if (route.method === "POST") {
      if (request.headers.get("origin") !== this.dependencies.origin ||
        (request.headers.has("sec-fetch-site") && request.headers.get("sec-fetch-site") !== "same-origin")) throw new PlatformError(403, "origin_rejected");
      if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new PlatformError(415, "json_required");
      if (!uuid.safeParse(request.headers.get("idempotency-key")).success) throw new PlatformError(400, "idempotency_key_required");
      idempotencyKey = request.headers.get("idempotency-key");
      let data: unknown;
      try { data = JSON.parse(await boundedText(request.body, BODY_LIMIT, AbortSignal.timeout(5000))); }
      catch (e) { if (e instanceof PlatformError) throw e; throw new PlatformError(400, "invalid_request"); }
      if (route.kind === "create" && data && typeof data === "object" && "operation" in data &&
        ["chat.respond", "project.refactor", "voice.synthesize"].includes(String(data.operation))) throw new PlatformError(503, "paid_operations_disabled");
      const parsed = (route.kind === "create" ? jobInput : z.object({}).strict()).safeParse(data);
      if (!parsed.success) throw new PlatformError(400, "invalid_request");
      body = JSON.stringify(parsed.data);
    }
    await this.dependencies.policy.admit(session.subject);
    // Re-read after body/rate processing. No cached catalog response authorizes an operation.
    const policy = await this.dependencies.policy.authorize(session);
    const token = await this.dependencies.sign({ session, policyVersion: policy.policy_version,
      method: route.method, path: route.path, body, requestId, idempotencyKey });
    const headers = new Headers({ Accept: "application/json", Authorization: `Bearer ${token}`, "X-Request-Id": requestId });
    if (route.method === "POST") { headers.set("Content-Type", "application/json"); headers.set("Idempotency-Key", idempotencyKey!); }
    // Reconstructed header set: browser Cookie/Authorization/identity/forwarded headers never pass through.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.dependencies.timeoutMs ?? 5000);
    const disconnect = () => controller.abort();
    request.signal.addEventListener("abort", disconnect, { once: true });
    try {
      const response = await (this.dependencies.fetcher ?? fetch)(this.dependencies.upstream + route.path, {
        method: route.method, headers, body: body || undefined, redirect: "manual", cache: "no-store", signal: controller.signal,
      });
      if (response.status >= 300 && response.status < 400) { await response.body?.cancel(); throw new PlatformError(503, "app_unavailable"); }
      if (!response.ok) {
        // Never relay upstream bodies, cookies, redirects, diagnostic messages or internal URLs.
        await response.body?.cancel();
        if (response.status === 404) throw new PlatformError(404, "job_not_found");
        if (response.status === 409) throw new PlatformError(409, "operation_conflict");
        if (response.status === 429) throw new PlatformError(429, "rate_limited");
        if (response.status === 403) throw new PlatformError(403, "access_denied");
        throw new PlatformError(503, "app_unavailable");
      }
      if (!response.headers.get("content-type")?.startsWith("application/json")) { await response.body?.cancel(); throw new PlatformError(502, "invalid_app_response"); }
      let text: string;
      try { text = await boundedText(response.body, RESPONSE_LIMIT, controller.signal); }
      catch (e) { if (controller.signal.aborted) throw e; throw new PlatformError(502, "invalid_app_response"); }
      let result: unknown;
      try { result = JSON.parse(text); } catch { throw new PlatformError(502, "invalid_app_response"); }
      const parsed = (route.kind === "context" ? contextResult : jobResult).safeParse(result);
      if (!parsed.success || parsed.data.subject !== session.subject) throw new PlatformError(502, "invalid_app_response");
      // Suppress a completed result if access/session was revoked while the service was running.
      await this.dependencies.policy.authorize(session, policy.policy_version);
      return parsed.data;
    } catch (error) {
      if (controller.signal.aborted) throw new PlatformError(504, "app_timeout");
      if (error instanceof PlatformError) throw error;
      throw new PlatformError(503, "app_unavailable");
    } finally { clearTimeout(timer); request.signal.removeEventListener("abort", disconnect); }
  }
}
