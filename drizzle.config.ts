import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: ".env.local", override: false, quiet: true });

export default defineConfig({
  out: "./drizzle",
  schema: ["./src/infrastructure/db/schema.ts", "./src/infrastructure/db/platform-schema.ts"],
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  schemaFilter: ["public"],
  // Only manage this application's tables. In particular, never delete the
  // Auth provider's schema_migrations table or other service-owned data.
  tablesFilter: ["superuser_permissions", "tool_platforms", "tool_requests", "tool_versions", "tools", "users", "vault_files", "admin_audit_events", "app_access", "gateway_rate_windows", "platform_admins", "platform_apps"],
  verbose: true,
  strict: true,
});
