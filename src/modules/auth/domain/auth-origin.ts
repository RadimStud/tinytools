const existingOrigins = ["https://tinytools-ten.vercel.app", "http://localhost:3000"];

/** Origin headers never add a new redirect destination. Config changes remain a deployment step. */
export function authOrigin(header: string | null): string | null {
  const configured = process.env.AUTH_ALLOWED_ORIGINS;
  const origins = configured ? configured.split(",").map(value => value.trim()).filter(Boolean) : existingOrigins;
  if (!header || !origins.includes(header)) return null;
  try {
    const url = new URL(header);
    if (url.origin !== header || !["https:", "http:"].includes(url.protocol)) return null;
    if (url.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return null;
    return url.origin;
  } catch { return null; }
}
