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
      max: 5,
    },
  );
