import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not configured.",
  );
}

export const sql =
  postgres(
    connectionString,
    {
      prepare: false,
      // Vercel creates multiple instances; each instance needs a small pool.
      // DATABASE_URL must use Supabase's transaction pooler in production.
      max: 1,
      idle_timeout: 20,
      max_lifetime: 300,
      connect_timeout: 15,
    },
  );
