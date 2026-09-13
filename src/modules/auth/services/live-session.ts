import type { Sql } from "postgres";

/** Use only claims already verified by Supabase, never a merely decoded browser token. */
export async function isLiveSession(sql: Sql, subject: string, sessionId: string): Promise<boolean> {
  const rows = await sql`
    SELECT s.id FROM auth.sessions s JOIN auth.users u ON u.id = s.user_id
    WHERE s.id = ${sessionId} AND s.user_id = ${subject}
      AND (s.not_after IS NULL OR s.not_after > now())
      AND (u.banned_until IS NULL OR u.banned_until <= now())
      AND u.deleted_at IS NULL
  `;
  return rows.length === 1;
}
