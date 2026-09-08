export const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/;

export const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;

export type VersionReleaseCandidate = {
  isActive: boolean;
  fileKey: string | null;
  checksum: string | null;
  createdAt: Date;
};

export function isValidSemver(
  version: string,
) {
  return SEMVER_PATTERN.test(
    version.trim(),
  );
}

export function isValidSha256(
  checksum: string,
) {
  return SHA256_PATTERN.test(
    checksum.trim().toLowerCase(),
  );
}

export function isReleasableVersion(
  version: VersionReleaseCandidate,
) {
  return (
    version.isActive &&
    Boolean(version.fileKey) &&
    Boolean(version.checksum) &&
    isValidSha256(
      version.checksum ?? "",
    )
  );
}

export function latestReleasableVersion<
  T extends VersionReleaseCandidate,
>(
  versions: T[],
) {
  return versions
    .filter(
      isReleasableVersion,
    )
    .slice()
    .sort(
      (left, right) =>
        right.createdAt.getTime() -
        left.createdAt.getTime(),
    )[0] ?? null;
}

export function fallbackFileNameFromKey(
  fileKey: string,
) {
  const segment =
    fileKey.split("/").pop();

  return segment && segment.length > 0
    ? segment
    : "download";
}

export function sanitizeDownloadFileName(
  fileName: string,
) {
  const base =
    fileName
      .split(/[/\\]/)
      .pop()
      ?.trim() ?? "";

  const cleaned =
    base
      .replace(
        /[\r\n"]/g,
        "",
      )
      .replace(
        /[^\w.\- ()[\]]+/g,
        "_",
      );

  if (
    !cleaned ||
    cleaned === "." ||
    cleaned === ".."
  ) {
    return "download";
  }

  return cleaned.slice(0, 180);
}
