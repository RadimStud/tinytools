import { redirect, notFound } from "next/navigation";
import { PlatformError } from "./domain/platform";
import type { PlatformService } from "./services/platform-service";
import { platformService } from "@/server/platform-services";
import { safeReturnPath } from "@/modules/auth/domain/return-path";

export async function platformPageData<T>(path: string, operation: (service: PlatformService) => Promise<T>): Promise<T | null> {
  try { return await operation(await platformService()); }
  catch (error) {
    if (error instanceof PlatformError && error.status === 401) redirect(`/login?${new URLSearchParams({ next: safeReturnPath(path) })}`);
    if (error instanceof PlatformError && [400, 403, 404].includes(error.status)) notFound();
    // Never send SQL/configuration details to a Server Component's error output.
    console.error("Platform page unavailable.");
    return null;
  }
}
