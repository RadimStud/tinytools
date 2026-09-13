import "server-only";
import { PlatformError } from "@/modules/platform/domain/platform";
import { PlatformService } from "@/modules/platform/services/platform-service";

export function platformEnabled() {
  return process.env.MINIKIT_PLATFORM_ENABLED === "1";
}

export async function platformService() {
  // Do not query the new schema in existing deployments before explicit activation/migration.
  if (!platformEnabled()) throw new PlatformError(503, "platform_disabled");
  const [{ services }, { sql }, { PostgresPlatformRepository }] = await Promise.all([
    import("@/server/services"), import("@/infrastructure/db/client"),
    import("@/modules/platform/repositories/postgres-platform-repository"),
  ]);
  return new PlatformService(services.auth, new PostgresPlatformRepository(sql), platformEnabled);
}
