import type { Sql } from "postgres";
import { PlatformError, type AccessChange, type AppAccess, type AuditEvent, type PlatformApp } from "../domain/platform";
import type { PlatformRepository } from "./platform-repository";

export class PostgresPlatformRepository implements PlatformRepository {
  constructor(private readonly sql: Sql) {}
  async isPlatformAdmin(subject: string) {
    const rows = await this.sql`SELECT 1 FROM public.platform_admins WHERE auth_user_id = ${subject}`;
    return rows.length === 1;
  }
  async listApps(): Promise<PlatformApp[]> {
    return [...await this.sql<PlatformApp[]>`SELECT app_id, name, description, state, internal_path, access_mode, contract_version FROM public.platform_apps ORDER BY app_id`];
  }
  async listAccess(subject: string): Promise<AppAccess[]> {
    return [...await this.sql<AppAccess[]>`SELECT auth_user_id, app_id, status, app_role, policy_version FROM public.app_access WHERE auth_user_id = ${subject}`];
  }
  async listUsers() {
    return [...await this.sql<{ auth_user_id: string; display_name: string }[]>`
      SELECT auth_user_id, display_name FROM public.users WHERE auth_user_id IS NOT NULL ORDER BY created_at DESC LIMIT 100
    `];
  }
  async recentAudit(): Promise<AuditEvent[]> {
    return [...await this.sql<AuditEvent[]>`
      SELECT request_id, actor_auth_user_id, target_auth_user_id, app_id, action, outcome, reason,
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
      FROM public.admin_audit_events ORDER BY created_at DESC LIMIT 50
    `];
  }
  async changeAccess(actor: string, change: AccessChange, requestId: string): Promise<AppAccess> {
    const result = await this.sql.begin(async tx => {
      // Recheck the persisted platform grant inside the write transaction, not only in UI/service.
      const admins = await tx`SELECT auth_user_id FROM public.platform_admins WHERE auth_user_id = ${actor} FOR SHARE`;
      if (admins.length !== 1) throw new PlatformError(403, "access_denied");
      const apps = await tx`SELECT access_mode FROM public.platform_apps WHERE app_id = ${change.app_id} FOR SHARE`;
      if (!apps.length) throw new PlatformError(404, "app_not_found");
      // P1 does not change the free Market/CSV policy or their existing route authorization.
      if (apps[0].access_mode !== "explicit") throw new PlatformError(409, "free_policy_not_editable");
      const users = await tx`SELECT auth_user_id FROM public.users WHERE auth_user_id = ${change.subject} FOR SHARE`;
      if (users.length !== 1) throw new PlatformError(404, "user_not_found");
      // Serialize even the first INSERT for this user/app. Hash collisions only serialize extra work.
      await tx`SELECT pg_advisory_xact_lock(hashtext(${change.subject}), hashtext(${change.app_id}))`;
      const existing = await tx<AppAccess[]>`
        SELECT auth_user_id, app_id, status, app_role, policy_version FROM public.app_access
        WHERE auth_user_id = ${change.subject} AND app_id = ${change.app_id} FOR UPDATE
      `;
      const before = existing[0] ?? null;
      if ((before?.policy_version ?? 0) !== change.expected_policy_version) {
        await tx`
          INSERT INTO public.admin_audit_events
            (request_id, actor_auth_user_id, target_auth_user_id, app_id, action, outcome, reason)
          VALUES (${requestId}, ${actor}, ${change.subject}, ${change.app_id}, 'access.change', 'conflict', ${change.reason})
        `;
        return { conflict: true as const, grant: null };
      }
      const grants = await tx<AppAccess[]>`
        INSERT INTO public.app_access (auth_user_id, app_id, status, app_role, policy_version, changed_by)
        VALUES (${change.subject}, ${change.app_id}, ${change.status}, ${change.app_role}, ${change.expected_policy_version + 1}, ${actor})
        ON CONFLICT (auth_user_id, app_id) DO UPDATE SET status = EXCLUDED.status, app_role = EXCLUDED.app_role,
          policy_version = EXCLUDED.policy_version, updated_at = now(), changed_by = EXCLUDED.changed_by
        RETURNING auth_user_id, app_id, status, app_role, policy_version
      `;
      const grant = grants[0];
      await tx`
        INSERT INTO public.admin_audit_events
          (request_id, actor_auth_user_id, target_auth_user_id, app_id, action, outcome, reason, before_state, after_state)
        VALUES (${requestId}, ${actor}, ${change.subject}, ${change.app_id}, 'access.change', 'success', ${change.reason},
          ${before ? tx.json(before) : null}, ${tx.json(grant)})
      `;
      return { conflict: false as const, grant };
    });
    if (result.conflict || !result.grant) throw new PlatformError(409, "policy_conflict");
    return result.grant;
  }
}
