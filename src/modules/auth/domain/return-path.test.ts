import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./return-path";

describe("approved login return paths", () => {
  it.each([undefined, null, 42, "", "https://external.invalid", "//external.invalid", "/\\external.invalid", "/%2fexternal.invalid", "/%252fexternal.invalid", "/apps%00", "/apps\n", "/apps/../admin", "/unknown", "/api/platform/v1/me", "/auth/callback", "/orion", "/apps%3Fnext=//external.invalid"])("rejects %j", value => {
    expect(safeReturnPath(value)).toBe("/dashboard");
    expect(safeReturnPath(value, "/apps")).toBe("/apps");
  });
  it.each(["/apps", "/account", "/account/password", "/dashboard", "/admin", "/platform/admin", "/superuser", "/search?q=csv%20cleaner", "/workbench/csv-cleaner", "/tools/sample-tool", "/dashboard/tools/11111111-1111-4111-8111-111111111111"])("preserves %s", value => {
    expect(safeReturnPath(value)).toBe(value);
  });
});
