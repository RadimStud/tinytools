import { describe, expect, it } from "vitest";

import {
  fallbackFileNameFromKey,
  isReleasableVersion,
  isValidSemver,
  isValidSha256,
  latestReleasableVersion,
  sanitizeDownloadFileName,
} from "./version-rules";

describe("version-rules", () => {
  it("accepts semver with optional prerelease", () => {
    expect(isValidSemver("1.0.0")).toBe(
      true,
    );
    expect(
      isValidSemver("1.0.0-beta.1"),
    ).toBe(true);
    expect(isValidSemver("v1.0.0")).toBe(
      false,
    );
  });

  it("accepts only 64-character hex checksums", () => {
    expect(
      isValidSha256(
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      ),
    ).toBe(true);

    expect(
      isValidSha256("abc"),
    ).toBe(false);
  });

  it("selects the latest releasable version", () => {
    const latest =
      latestReleasableVersion([
        {
          isActive: true,
          fileKey: "old",
          checksum:
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          createdAt: new Date(
            "2026-01-01",
          ),
        },
        {
          isActive: true,
          fileKey: "new",
          checksum:
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
          createdAt: new Date(
            "2026-02-01",
          ),
        },
        {
          isActive: true,
          fileKey: null,
          checksum: null,
          createdAt: new Date(
            "2026-03-01",
          ),
        },
      ]);

    expect(latest?.fileKey).toBe(
      "new",
    );
    expect(
      isReleasableVersion(
        latest!,
      ),
    ).toBe(true);
  });

  it("sanitizes download filenames and falls back from file keys", () => {
    expect(
      sanitizeDownloadFileName(
        "../../secret.txt",
      ),
    ).toBe("secret.txt");

    expect(
      fallbackFileNameFromKey(
        "tools/abc/1.0.0/app.exe",
      ),
    ).toBe("app.exe");
  });
});
