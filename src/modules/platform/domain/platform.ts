export type PlatformIdentity = { authUserId: string; displayName: string };
export type AppState = "available" | "coming_soon" | "unavailable";
export type AccessStatus = "enabled" | "suspended" | "revoked";
export type AppRole = "user" | "app_admin";
export type PlatformApp = {
  app_id: string; name: string; description: string; state: AppState;
  internal_path: string | null; access_mode: "explicit" | "public_free" | "authenticated_free";
  contract_version: string;
};
export type AppAccess = {
  auth_user_id: string; app_id: string; status: AccessStatus; app_role: AppRole;
  policy_version: number;
};
export type AccessChange = {
  subject: string; app_id: string; status: AccessStatus; app_role: AppRole;
  expected_policy_version: number; reason: string;
};
export type AppView = PlatformApp & {
  access: AccessStatus | "none" | "free";
  display_state: "available" | "no_access" | "coming_soon" | "unavailable";
  permissions: string[]; policy_version: number; launch_path: string | null;
  limits: null; paid_operations_enabled: false;
};
export type AuditEvent = {
  request_id: string; actor_auth_user_id: string; target_auth_user_id: string | null;
  app_id: string | null; action: string; outcome: string; reason: string; created_at: string;
};
export class PlatformError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super(code); this.name = "PlatformError";
  }
}

// These are product entry points, not configurable proxy targets. ORION has no adapter in P1.
const launchPaths: Readonly<Record<string, string>> = {
  market: "/dashboard", "csv-cleaner": "/workbench/csv-cleaner",
};
export function appView(app: PlatformApp, grant: AppAccess | null): AppView {
  const access = grant?.status ?? (app.access_mode === "explicit" ? "none" : "free");
  const enabled = access === "enabled" || access === "free";
  const ready = app.state === "available" && app.app_id !== "orion" &&
    launchPaths[app.app_id] === app.internal_path;
  const display_state = app.app_id === "orion" || app.state === "coming_soon" ? "coming_soon"
    : app.state === "unavailable" || (app.state === "available" && !ready) ? "unavailable"
    : !enabled ? "no_access" : "available";
  return {
    ...app, access, display_state,
    permissions: enabled ? [app.app_id + ".use", ...(grant?.app_role === "app_admin" ? [app.app_id + ".admin"] : [])] : [],
    policy_version: grant?.policy_version ?? 0,
    launch_path: display_state === "available" ? launchPaths[app.app_id] : null,
    limits: null, paid_operations_enabled: false,
  };
}
