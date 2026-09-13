import { authLandingPath, safeReturnPath } from "./return-path";

export function authCompletionPath(value: unknown): string {
  const next = safeReturnPath(value, authLandingPath());
  return process.env.MINIKIT_PLATFORM_ENABLED === "1"
    ? `/auth/complete?${new URLSearchParams({ next })}` : next;
}
