import { createHash } from "node:crypto";
import { z } from "zod";
import { PlatformError } from "../domain/platform";

export const CONTRACT = "minikit.orion/1.0";
export const TOKEN_SECONDS = 45;
export const CLOCK_SKEW_SECONDS = 3;
export const BODY_LIMIT = 32 * 1024;
export const RESPONSE_LIMIT = 64 * 1024;
export const uuid = z.string().uuid();
export const assertionSchema = z.object({
  iss: z.string().min(1), aud: z.literal("orion"), sub: uuid, sid: uuid,
  iat: z.number().int(), exp: z.number().int(), jti: uuid, request_id: uuid,
  app_id: z.literal("orion"), permissions: z.tuple([z.literal("orion.use")]),
  policy_version: z.number().int().positive(), v: z.literal(CONTRACT),
  htm: z.enum(["GET", "POST"]), htu: z.string().startsWith("/v1/"),
  body_sha256: z.string().regex(/^[a-f0-9]{64}$/), idempotency_key: uuid.nullable(),
}).strict();
export type Assertion = z.infer<typeof assertionSchema>;
export type GatewaySession = { subject: string; sessionId: string };
export type Policy = { policy_version: number };
export const jobInput = z.object({ operation: z.literal("contract.echo"), input: z.object({ text: z.string().max(4096) }).strict() }).strict();
export const contextResult = z.object({ app_id: z.literal("orion"), subject: uuid,
  policy_version: z.number().int().positive(), permissions: z.tuple([z.literal("orion.use")]),
  mode: z.literal("contract-test"), paid_operations_enabled: z.literal(false), limits: z.null(),
}).strict();
export const jobResult = z.object({ id: uuid, subject: uuid, state: z.enum(["queued", "completed"]),
  operation: z.literal("contract.echo"), output: z.object({ text: z.string().max(4096) }).strict().nullable(),
  policy_version: z.number().int().positive(),
}).strict();
export function digest(body: string | Uint8Array): string { return createHash("sha256").update(body).digest("hex"); }
export type OperationRoute = { method: "GET" | "POST"; path: string; kind: "context" | "create" | "read" | "run"; jobId?: string };
export function operationRoute(method: string, path: string): OperationRoute {
  if (method === "GET" && path === "/v1/context") return { method, path, kind: "context" };
  if (method === "POST" && path === "/v1/jobs") return { method, path, kind: "create" };
  const job = /^\/v1\/jobs\/([0-9a-f-]{36})(\/run)?$/.exec(path);
  if (job && uuid.safeParse(job[1]).success) {
    if (method === "GET" && !job[2]) return { method, path, kind: "read", jobId: job[1] };
    if (method === "POST" && job[2]) return { method, path, kind: "run", jobId: job[1] };
  }
  throw new PlatformError(["GET", "POST"].includes(method) ? 404 : 405, "operation_not_supported");
}

/** Streaming cap applies to actual bytes, not just the untrusted Content-Length. */
export async function boundedText(stream: ReadableStream<Uint8Array> | null, limit: number, signal?: AbortSignal): Promise<string> {
  if (!stream) return "";
  const reader = stream.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    if (signal?.aborted) throw new PlatformError(504, "app_timeout");
    while (true) {
      const { done, value } = await reader.read();
      if (signal?.aborted) throw new PlatformError(504, "app_timeout");
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new PlatformError(413, "payload_too_large"); }
      chunks.push(value);
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
  } finally { signal?.removeEventListener("abort", abort); reader.releaseLock(); }
}
