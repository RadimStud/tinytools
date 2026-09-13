import { platformService } from "@/server/platform-services";
import { platformResponse } from "@/modules/platform/http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ appId: string }> }) {
  return platformResponse(async () => (await platformService()).access((await params).appId));
}
