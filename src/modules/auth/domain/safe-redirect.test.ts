import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it.each([
    undefined, null, 42, "", "dashboard", "https://external.invalid", "javascript:alert(1)",
    "//external.invalid", "///external.invalid", "/\\external.invalid", "/\t/external.invalid",
    " /dashboard", "/dashboard\n", "/%2fexternal.invalid", "/%5cexternal.invalid",
    "/%09/external.invalid", "/%00", "/broken%escape",
  ])("rejects unsafe or invalid input %j", (input) => {
    expect(safeRedirectPath(input)).toBe("/dashboard");
  });

  it.each([
    ["/", "/"], ["/dashboard", "/dashboard"],
    ["/dashboard/tools/123", "/dashboard/tools/123"],
    ["/search?q=csv%20cleaner#results", "/search?q=csv%20cleaner#results"],
    ["/search?q=https%3A%2F%2Fexample.invalid", "/search?q=https%3A%2F%2Fexample.invalid"],
    ["/tools/../dashboard", "/dashboard"],
  ])("preserves local path %s", (input, expected) => {
    const output = safeRedirectPath(input);
    expect(output).toBe(expected);
    expect(new URL(output, "https://tinytools-ten.vercel.app").origin)
      .toBe("https://tinytools-ten.vercel.app");
  });
});
