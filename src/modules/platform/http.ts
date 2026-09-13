import { randomUUID } from "node:crypto";
import { PlatformError } from "./domain/platform";

const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" };
export async function platformResponse(operation: (requestId: string) => Promise<unknown>) {
  const requestId = randomUUID();
  try {
    return Response.json({ data: await operation(requestId), request_id: requestId }, { headers });
  } catch (error) {
    const known = error instanceof PlatformError;
    if (!known) console.error("Platform operation failed", { request_id: requestId });
    return Response.json({ error: { code: known ? error.code : "platform_unavailable" }, request_id: requestId }, {
      status: known ? error.status : 503, headers,
    });
  }
}

export async function readPlatformMutation(request: Request) {
  const configured = process.env.MINIKIT_PLATFORM_ORIGIN;
  let origin: URL;
  try {
    origin = new URL(configured ?? "");
    if (origin.origin !== configured || !["https:", "http:"].includes(origin.protocol)) throw new Error();
    if (origin.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)) throw new Error();
  } catch { throw new PlatformError(503, "platform_origin_not_configured"); }
  if (request.headers.get("origin") !== origin.origin) throw new PlatformError(403, "origin_rejected");
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") throw new PlatformError(403, "origin_rejected");
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new PlatformError(415, "json_required");
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > 8192)) throw new PlatformError(413, "payload_too_large");
  const reader = request.body?.getReader();
  if (!reader) throw new PlatformError(400, "invalid_request");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) { await reader.cancel(); throw new PlatformError(413, "payload_too_large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown; }
  catch { throw new PlatformError(400, "invalid_request"); }
}
