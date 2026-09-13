import { describe, expect, it } from "vitest";
import { getOrionWebUrl } from "./orion-launch";

describe("ORION launch configuration", () => {
  it("normalizes the HTTPS origin", () => {
    expect(getOrionWebUrl(" https://orion.example.com ")).toBe("https://orion.example.com/");
  });

  it.each([
    "", "not a URL", "//orion.example.com", "http://orion.example.com",
    "javascript:alert(1)", "https://owner:password@orion.example.com",
    "https://orion.example.com/?token=secret", "https://orion.example.com/#secret",
    "https://orion.example.com/api/call", "https://orion.example.com/\\other",
    "https://orion.\nexample.com",
  ])("rejects unsafe or non-origin configuration: %s", (value) => {
    expect(getOrionWebUrl(value)).toBeNull();
  });
});
