import { expect, test } from "@playwright/test";
const A = "11111111-1111-4111-8111-111111111111", B = "22222222-2222-4222-8222-222222222222";

test("private content stays unmounted until a verified matching identity arrives", async ({ page }) => {
  let release = () => {};
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/auth/session", async route => { await pending; await route.fulfill({ json: { data: { subject: A } } }); });
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("Checking");
  await expect(page.getByRole("heading", { name: "Private A workspace" })).toHaveCount(0);
  release();
  await expect(page.getByRole("heading", { name: "Private A workspace" })).toBeVisible();
});

test("a different verified account never reveals the previous account's components", async ({ page }) => {
  await page.route("**/api/auth/session", route => route.fulfill({ json: { data: { subject: B } } }));
  await page.goto("/");
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.getByRole("heading", { name: "Sign in fixture" })).toBeVisible();
  await expect(page.getByLabel("Private draft")).toHaveCount(0);
});

test("provider failure fails closed rather than retaining private content", async ({ page }) => {
  await page.route("**/api/auth/session", route => route.fulfill({ status: 503, json: { error: "synthetic-private-detail" } }));
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("could not be verified");
  await expect(page.getByLabel("Private draft")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("synthetic-private-detail");
});

test("an anonymous response clears the workspace", async ({ page }) => {
  await page.route("**/api/auth/session", route => route.fulfill({ status: 401, json: { error: "unauthenticated" } }));
  await page.goto("/");
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.getByLabel("Private draft")).toHaveCount(0);
});

for (const storageOnly of [false, true]) {
  test(`cross-tab account change removes private state (${storageOnly ? "storage fallback" : "BroadcastChannel"})`, async ({ context, page }) => {
    if (storageOnly) await context.addInitScript(() => { Object.defineProperty(window, "BroadcastChannel", { value: undefined }); });
    let subject = A;
    await context.route("**/api/auth/session", route => route.fulfill({ json: { data: { subject } } }));
    await page.goto("/");
    await expect(page.getByLabel("Private draft")).toBeVisible();
    const control = await context.newPage();
    await control.goto("/?control=1");
    await control.getByRole("button", { name: "Begin auth change" }).click();
    await expect(page.getByLabel("Private draft")).not.toBeVisible();
    subject = B;
    await control.getByRole("button", { name: "Commit auth change" }).click();
    await expect(page).toHaveURL(/\/login\?/);
    await expect(page.getByLabel("Private draft")).toHaveCount(0);
    await control.close();
  });
}

test("back-forward restoration rechecks identity before showing old content", async ({ page }) => {
  let subject = A;
  await page.route("**/api/auth/session", route => route.fulfill({ json: { data: { subject } } }));
  await page.goto("/");
  await expect(page.getByLabel("Private draft")).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
  await expect(page.getByLabel("Private draft")).not.toBeVisible();
  subject = B;
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.getByLabel("Private draft")).toHaveCount(0);
});

test("refocusing a tab detects cookie changes even without a broadcast", async ({ page }) => {
  let subject = A;
  await page.route("**/api/auth/session", route => route.fulfill({ json: { data: { subject } } }));
  await page.goto("/");
  await expect(page.getByLabel("Private draft")).toBeVisible();
  subject = B;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.getByLabel("Private draft")).toHaveCount(0);
});

test("invalid broadcast messages cannot grant a session", async ({ page }) => {
  await page.route("**/api/auth/session", route => route.fulfill({ status: 503, json: {} }));
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("could not be verified");
  await page.evaluate(() => {
    const channel = new BroadcastChannel("minikit-session-v1");
    channel.postMessage({ version: 1, type: "grant-admin", subject: "forged" }); channel.close();
  });
  await expect(page.getByLabel("Private draft")).toHaveCount(0);
});
