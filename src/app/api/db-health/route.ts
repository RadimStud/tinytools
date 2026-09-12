import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    // Include configuration/import failures in the redacted failure response.
    const { sql } = await import("@/infrastructure/db/client");
    const result = await sql`select current_timestamp as now`;
    if (!result[0]?.now) throw new Error("Missing database timestamp.");
    return NextResponse.json({
      service: "tinytools-database",
      status: "ok",
      databaseTime: result[0].now,
    }, { headers });
  } catch {
    // A public health check must not disclose SQL, credentials or host details.
    console.error("Database health probe failed.");
    return NextResponse.json({
      service: "tinytools-database",
      status: "error",
      message: "Database temporarily unavailable.",
    }, { status: 503, headers });
  }
}
