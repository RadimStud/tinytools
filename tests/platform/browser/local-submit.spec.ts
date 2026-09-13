import { expect, test } from "@playwright/test";
test("local pending invalidation dispatches the form and keeps a safe recovery control", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/auth/session", route => route.fulfill({ json: { data: { subject: "11111111-1111-4111-8111-111111111111" } } }));
  await page.route("**/fixture/action", async route => { calls++; await route.fulfill({ status: 503, json: { error: "simulated auth provider failure" } }); });
  await page.goto("/");
  await page.getByRole("button", { name: "Change session locally" }).click();
  await expect.poll(() => calls).toBe(1);
  await expect(page.getByLabel("Private draft")).not.toBeVisible();
  await expect(page.getByRole("status")).toContainText("Private content is hidden");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByLabel("Private draft")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Reload securely" })).toBeVisible();
  await page.getByRole("button", { name: "Reload securely" }).click();
  await expect(page.getByLabel("Private draft")).toBeVisible();
  expect(calls).toBe(1); // Reload verifies the account, never resubmits the action.
});
