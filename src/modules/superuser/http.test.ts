import { expect, it } from "vitest";
import { requireSameOrigin, vaultFailure, vaultResponse } from "./http";
it("rejects mutations from a different or missing origin", () => {
  for (const origin of ["https://other.example", "null", ""]) {
    expect(() => requireSameOrigin(new Request("https://minikit.example/api/superuser/files", { headers: { origin } }))).toThrow();
  }
  expect(() => requireSameOrigin(new Request("https://minikit.example/api/superuser/files", { headers: { origin: "https://minikit.example" } }))).not.toThrow();
});
it("does not leak database or storage errors and disables response caching", async () => {
  const response = vaultFailure(new Error("secret storage credentials"));
  expect(await response.text()).not.toContain("secret");
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(vaultResponse({ ok: true }).headers.get("Cache-Control")).toContain("no-store");
});
