import {
  NextResponse,
} from "next/server";

import { sql } from "@/infrastructure/db/client";

export async function GET() {
  try {
    const result =
      await sql`
        select
          current_timestamp
            as now
      `;

    return NextResponse.json({
      service:
        "tinytools-database",

      status:
        "ok",

      databaseTime:
        result[0]?.now,
    });
  }
  catch (error) {
    return NextResponse.json(
      {
        service:
          "tinytools-database",

        status:
          "error",

        message:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      },
      {
        status: 500,
      },
    );
  }
}
