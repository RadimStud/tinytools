import { randomUUID } from "node:crypto";
import { gatewayConfig } from "@/modules/platform/gateway/config";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  try { return Response.json(gatewayConfig().jwks, { headers: { "Cache-Control": "public, max-age=30", "X-Content-Type-Options": "nosniff" } }); }
  catch { return Response.json({ error: { code: "app_unavailable" }, request_id: randomUUID() }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
