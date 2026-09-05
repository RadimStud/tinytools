import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
  override: true,
});

import {
  defineConfig,
} from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",

  schema:
    "./src/infrastructure/db/schema.ts",

  dialect:
    "postgresql",

  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "",
  },

  schemaFilter: [
    "public",
  ],

  verbose: true,
  strict: true,
});