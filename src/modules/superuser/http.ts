import { NextResponse } from "next/server";
import { VaultError } from "./domain/vault";

export const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
export function requireSameOrigin(request: Request) {
  // Next may normalize request.url to localhost behind its server/proxy.
  // Host preserves the browser-facing authority; forwarded-host is not used.
  const url = new URL(request.url);
  const host = request.headers.get("host") || url.host;
  const protocol = request.headers.get("x-forwarded-proto") || url.protocol.slice(0, -1);
  if (!["http", "https"].includes(protocol) || request.headers.get("origin") !== `${protocol}://${host}`) {
    throw new VaultError("Request origin is not allowed.", 403);
  }
}
export function vaultResponse(data: unknown) { return NextResponse.json(data, { headers: privateHeaders }); }
export function vaultFailure(error: unknown) {
  return NextResponse.json({ error: error instanceof VaultError ? error.message : "Vault operation failed. Please try again." }, {
    status: error instanceof VaultError ? error.status : 500, headers: privateHeaders,
  });
}
