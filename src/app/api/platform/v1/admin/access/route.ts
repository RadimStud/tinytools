import { platformService } from "@/server/platform-services";
import { PlatformError } from "@/modules/platform/domain/platform";
import { platformResponse, readPlatformMutation } from "@/modules/platform/http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function PUT(request: Request) {
  return platformResponse(async requestId => {
    const service = await platformService();
    const me = await service.me();
    if (!me.platform_permissions.includes("platform.admin")) throw new PlatformError(403, "access_denied");
    const input = await readPlatformMutation(request);
    return service.changeAccess(input, requestId);
  });
}
