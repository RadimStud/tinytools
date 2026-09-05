import { drizzle } from "drizzle-orm/postgres-js";

import { sql } from "./client";

export const db = drizzle({
  client: sql,
});