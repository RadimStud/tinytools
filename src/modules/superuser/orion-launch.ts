/** A server-configured origin, never a destination supplied by a visitor. */
export function getOrionWebUrl(value = process.env.ORION_WEB_URL): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== "https:" || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash ||
      /[\s\\]/.test(value.trim())
    ) return null;
    return `${url.origin}/`;
  } catch {
    return null;
  }
}
