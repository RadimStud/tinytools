const fallbackPath = "/dashboard";
const localOrigin = "https://minikit.invalid";

function unsafeCharacters(value: string, rejectSpace = false): boolean {
  return value.includes("\\") || Array.from(value).some(character => {
    const code = character.charCodeAt(0);
    return code <= (rejectSpace ? 32 : 31) || code === 127;
  });
}

/** Accept local application paths, never a protocol-relative or external URL. */
export function safeRedirectPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    unsafeCharacters(value, true)
  ) return fallbackPath;

  try {
    const target = new URL(value, localOrigin);
    const decodedPath = decodeURIComponent(target.pathname);
    if (
      target.origin !== localOrigin ||
      decodedPath.startsWith("//") ||
      unsafeCharacters(decodedPath)
    ) return fallbackPath;

    return target.pathname + target.search + target.hash;
  } catch {
    return fallbackPath;
  }
}
