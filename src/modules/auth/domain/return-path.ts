const allowed = new Set([
  "/", "/apps", "/account", "/account/password", "/dashboard", "/publish", "/request", "/search",
  "/admin", "/admin/tools", "/admin/users", "/platform/admin", "/superuser", "/workbench/csv-cleaner", "/community",
]);

/** P1 return destinations are approved application pages, never API endpoints or arbitrary URLs. */
export function safeReturnPath(value: unknown, fallback: "/dashboard" | "/apps" = "/dashboard"): string {
  if (typeof value !== "string" || value.length > 2048 || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (Array.from(value).some(character => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127)) return fallback;
  const rawPath = value.split(/[?#]/)[0];
  // Approved paths are ASCII literals/identifiers: no encoded separators, nested encoding or traversal.
  if (rawPath.includes("%") || rawPath.split("/").some(part => part === "." || part === "..")) return fallback;
  try {
    const url = new URL(value, "https://minikit.invalid");
    if (url.origin !== "https://minikit.invalid") return fallback;
    const path = url.pathname;
    const dynamic = /^\/dashboard\/tools\/[0-9a-f-]{36}$/i.test(path) || /^\/tools\/[a-z0-9][a-z0-9-]{0,159}$/.test(path);
    if (!allowed.has(path) && !dynamic) return fallback;
    return path + url.search + url.hash;
  } catch { return fallback; }
}

export function authLandingPath(): "/apps" | "/dashboard" {
  return process.env.MINIKIT_PLATFORM_ENABLED === "1" ? "/apps" : "/dashboard";
}
