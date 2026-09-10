import { NextResponse } from "next/server";
import { services } from "@/server/services";
import { privateHeaders, vaultFailure } from "@/modules/superuser/http";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const url = await services.vault.download((await context.params).id);
    return new NextResponse(null, { status: 307, headers: { ...privateHeaders, Location: url } });
  } catch (error) { return vaultFailure(error); }
}
