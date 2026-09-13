import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: ".env.local", override: false });

export default defineConfig({
  out: "./drizzle",
  schema: ["./src/infrastructure/db/schema.ts", "./src/infrastructure/db/platform-schema.ts"],
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
