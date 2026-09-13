import { z } from "zod";
import { PlatformError } from "@/modules/platform/domain/platform";
import { platformResponse } from "@/modules/platform/http";
import { boundedText, CONTRACT, uuid } from "@/modules/platform/gateway/contract";
import { gatewayConfig, matchesServiceCredential } from "@/modules/platform/gateway/config";
import { PostgresGatewayPolicy } from "@/modules/platform/gateway/repository";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const schema = z.object({ subject: uuid, session_id: uuid, policy_version: z.number().int().positive(),
  operation_id: uuid, operation: z.literal("contract.echo"),
}).strict();
export async function POST(request: Request) {
  return platformResponse(async () => {
    const config = gatewayConfig();
    // A machine credential is not a cookie session. Browsers must not call this internal API.
    if (request.headers.has("cookie") || request.headers.has("origin") ||
      !matchesServiceCredential(request.headers.get("authorization"), config.serviceCredential)) throw new PlatformError(401, "invalid_service_credential");
    if (request.headers.get("content-type") !== "application/json") throw new PlatformError(415, "json_required");
    let input: unknown;
    try { input = JSON.parse(await boundedText(request.body, 8192, AbortSignal.timeout(5000))); }
    catch (error) { if (error instanceof PlatformError) throw error; throw new PlatformError(400, "invalid_request"); }
    const parsed = schema.safeParse(input);
    if (!parsed.success) throw new PlatformError(400, "invalid_request");
    const { sql } = await import("@/infrastructure/db/client");
    const data = parsed.data;
    const repository = new PostgresGatewayPolicy(sql);
    const policy = await repository.authorize({ subject: data.subject, sessionId: data.session_id }, data.policy_version);
    return { subject: data.subject, operation_id: data.operation_id, app_id: "orion", policy_version: policy.policy_version,
      permissions: ["orion.use"], contract_version: CONTRACT, allowed: true, paid_operations_enabled: false, limits: null };
  });
}
