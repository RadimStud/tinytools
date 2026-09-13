import { expect, test } from "@playwright/test";
// Only included in the isolated proposed-build suite, whose platform flag is disabled.
test("disabled platform has no new-schema requirement or usable ORION launch", async ({ page, request }) => {
  await page.goto("/apps");
  await expect(page.getByRole("heading", { name: "Platform not available", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /open orion/i })).toHaveCount(0);
  const response = await request.get("/api/platform/v1/me");
  expect(response.status()).toBe(503); expect((await response.json()).error.code).toBe("platform_disabled");
  expect((await request.get("/api/auth/session")).status()).toBe(404);
});
test("login form rejects external next while retaining an approved deep link", async ({ page }) => {
  await page.goto("/login?next=%2F%2Fexternal.invalid");
  await expect(page.locator('input[name="next"]')).toHaveValue("/dashboard");
  await page.goto("/login?next=%2Fdashboard%2Ftools%2F11111111-1111-4111-8111-111111111111");
  await expect(page.locator('input[name="next"]')).toHaveValue("/dashboard/tools/11111111-1111-4111-8111-111111111111");
  await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();
});
