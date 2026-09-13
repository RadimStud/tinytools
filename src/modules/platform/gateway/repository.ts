import type { Sql } from "postgres";
import { PlatformError } from "../domain/platform";
import { isLiveSession } from "@/modules/auth/services/live-session";
import type { GatewaySession, Policy } from "./contract";

export interface GatewayPolicyRepository {
  authorize(session: GatewaySession, expectedVersion?: number): Promise<Policy>;
  admit(subject: string): Promise<void>;
}
export class PostgresGatewayPolicy implements GatewayPolicyRepository {
  constructor(private readonly sql: Sql) {}
  async authorize(session: GatewaySession, expectedVersion?: number): Promise<Policy> {
    if (!await isLiveSession(this.sql, session.subject, session.sessionId)) throw new PlatformError(401, "unauthenticated");
    const rows = await this.sql`
      SELECT a.status, a.policy_version, p.state FROM public.app_access a
      JOIN public.platform_apps p ON p.app_id = a.app_id
      WHERE a.auth_user_id = ${session.subject} AND a.app_id = 'orion' AND p.access_mode = 'explicit'
    `;
    if (!rows.length || rows[0].status !== "enabled") throw new PlatformError(403, "access_denied");
    if (rows[0].state === "unavailable") throw new PlatformError(503, "app_unavailable");
    const version = Number(rows[0].policy_version);
    if (expectedVersion !== undefined && version !== expectedVersion) throw new PlatformError(409, "policy_conflict");
    return { policy_version: version };
  }
  async admit(subject: string): Promise<void> {
    // Fixed per-minute guard, not a budget. Atomic across application instances.
    const rows = await this.sql`
      INSERT INTO public.gateway_rate_windows (auth_user_id, minute, hits)
      VALUES (${subject}, date_trunc('minute', now()), 1)
      ON CONFLICT (auth_user_id, minute) DO UPDATE SET hits = gateway_rate_windows.hits + 1
        WHERE gateway_rate_windows.hits < 60
      RETURNING hits
    `;
    if (!rows.length) throw new PlatformError(429, "rate_limited");
    await this.sql`DELETE FROM public.gateway_rate_windows WHERE minute < now() - interval '2 minutes'`;
  }
}
