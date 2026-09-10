import fs from "node:fs";
import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: ".env.local", quiet: true });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, connect_timeout: 15 });
try {
  await sql.unsafe(fs.readFileSync(new URL("../drizzle/0003_superuser_vault.sql", import.meta.url), "utf8"));
  const grants = await sql`SELECT user_id FROM superuser_permissions`;
  if (grants.length !== 1 || grants[0].user_id !== "2e954c50-23d5-4e68-be4c-ff9a61a697ad") {
    throw new Error("Unexpected superuser grants. Review the database before deployment.");
  }
  console.log("SUPERUSER MIGRATION OK: permission assigned exclusively to the configured owner.");
} catch (error) {
  console.error("Migration failed:", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
} finally {
  await sql.end();
}
