import { expect, test } from "@playwright/test";
const A = "11111111-1111-4111-8111-111111111111";
test("a pending change cannot restore the old workspace on focus", async ({ page, context }) => {
  await context.route("**/api/auth/session", route => route.fulfill({ json: { data: { subject: A } } }));
  await page.goto("/"); await expect(page.getByLabel("Private draft")).toBeVisible();
  const control = await context.newPage(); await control.goto("/?control=1");
  await control.getByRole("button", { name: "Begin auth change" }).click();
  await expect(page.getByLabel("Private draft")).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByRole("status")).toContainText("Private content has been cleared");
  await expect(page.getByLabel("Private draft")).toHaveCount(0);
  await control.close();
});
test("a late identity response cannot resurrect invalidated components", async ({ context, page }) => {
  let release = () => {};
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/auth/session", async route => {
    await pending;
    await route.fulfill({ json: { data: { subject: A } } }).catch(() => {});
  });
  await page.goto("/"); await expect(page.getByRole("status")).toContainText("Checking");
  const control = await context.newPage(); await control.goto("/?control=1");
  await control.getByRole("button", { name: "Begin auth change" }).click();
  await expect(page.getByRole("status")).toContainText("Private content has been cleared");
  release();
  await expect(page.getByLabel("Private draft")).toHaveCount(0);
  await control.getByRole("button", { name: "Commit auth change" }).click();
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.getByLabel("Private draft")).toHaveCount(0);
  await control.close();
});
