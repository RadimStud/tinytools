import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env.local", override: false, quiet: true });
const args = process.argv.slice(2);
const command = args[0];
const value = name => { const i = args.indexOf(name); return i < 0 ? "" : args[i + 1] || ""; };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (!args.includes("--apply") || !["migrate", "bootstrap"].includes(command)) {
  console.log("No changes made. Use: node scripts/platform-db.mjs migrate --apply");
  console.log("Explicit owner bootstrap: bootstrap --apply --subject UUID --confirm-subject UUID --reason 'Reason'");
  process.exit(2);
}
if (!process.env.DATABASE_URL) { console.error("DATABASE_URL is required; its value must remain private."); process.exit(2); }
const subject = value("--subject");
const reason = value("--reason").trim();
if (command === "bootstrap" && (!uuid.test(subject) || value("--confirm-subject") !== subject || reason.length < 5 || reason.length > 500)) {
  console.error("Bootstrap requires one existing Auth UUID, an identical confirmation UUID, and a 5–500 character reason.");
  process.exit(2);
}
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, connect_timeout: 15 });
try {
  await sql.begin(async tx => {
    await tx`SELECT pg_advisory_xact_lock(18412982, 4)`;
    if (command === "migrate") {
      const migration = await fs.readFile(new URL("../drizzle/0004_platform_accounts.sql", import.meta.url), "utf8");
      await tx.unsafe(migration);
      console.log("P1 schema migration applied. No platform admin was granted.");
    } else {
      const users = await tx`SELECT auth_user_id FROM public.users WHERE auth_user_id = ${subject} FOR UPDATE`;
      if (users.length !== 1) throw new Error("User must already be mapped in MiniKit.");
      const inserted = await tx`INSERT INTO public.platform_admins (auth_user_id, reason) VALUES (${subject}, ${reason}) ON CONFLICT DO NOTHING RETURNING auth_user_id`;
      if (inserted.length) {
        await tx`INSERT INTO public.admin_audit_events (request_id, actor_auth_user_id, target_auth_user_id, action, outcome, reason)
          VALUES (${randomUUID()}, ${subject}, ${subject}, 'platform.bootstrap', 'success', ${reason})`;
      }
      console.log(inserted.length ? "The explicitly confirmed account is now a platform administrator." : "This account already has the platform grant; no changes made.");
    }
  });
  console.log("Transaction committed. No Market/Superuser records were modified.");
} catch {
  console.error("Platform database operation failed and was rolled back. Check the migration, selected account and database permissions. No connection details are printed.");
  process.exitCode = 1;
} finally { await sql.end({ timeout: 5 }); }
