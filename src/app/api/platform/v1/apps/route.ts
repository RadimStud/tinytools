import { platformService } from "@/server/platform-services";
import { platformResponse } from "@/modules/platform/http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  return platformResponse(async () => (await platformService()).apps());
}
