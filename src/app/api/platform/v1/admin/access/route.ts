import { platformService } from "@/server/platform-services";
import { PlatformError } from "@/modules/platform/domain/platform";
import { platformResponse, readPlatformMutation } from "@/modules/platform/http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function PUT(request: Request) {
  return platformResponse(async requestId => {
    let stage = "SERVICE";
    try {
      const service = await platformService();
      stage = "IDENTITY";
      const me = await service.me();
      if (!me.platform_permissions.includes("platform.admin")) throw new PlatformError(403, "access_denied");
      stage = "BODY";
      const input = await readPlatformMutation(request);
      stage = "WRITE";
      return await service.changeAccess(input, requestId);
    } catch (error) {
      if (!(error instanceof PlatformError)) console.error("Platform failure stage: " + stage);
      throw error;
    }
  });
}
