import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const config = JSON.parse(readFileSync(".p2-local/test.json", "utf8"));
const origin = "http://127.0.0.1:3100";
if (config.MINIKIT_DEPLOYMENT_ENV !== "isolated-test" || config.MINIKIT_PLATFORM_ORIGIN !== origin) throw new Error("Disposable local providers required.");
type Account = { email: string; password: string; name: string; context: BrowserContext; page: Page };
let a: Account, b: Account;
const contexts: BrowserContext[] = [];
test.describe.configure({ mode: "serial" });

async function confirmation(email: string) {
  let link = "";
  await expect.poll(async () => {
    const inbox = await (await fetch("http://127.0.0.1:54324/api/v1/messages")).json();
    const message = inbox.messages?.find((m: { To: { Address: string }[]; Subject: string }) => m.To.some(x => x.Address === email) && m.Subject.toLowerCase().includes("confirm"));
    if (!message) return false;
    const details = await (await fetch(`http://127.0.0.1:54324/api/v1/message/${message.ID}`)).json();
    const raw = String(details.HTML).match(/href="([^"]+)"/)?.[1]?.replaceAll("&amp;", "&");
    if (!raw) return false;
    const target = new URL(raw);
    if (target.origin !== "http://127.0.0.1:54321" || target.pathname !== "/auth/v1/verify") throw new Error("Unexpected local confirmation link.");
    link = raw; return true;
  }, { timeout: 30000, message: "Disposable provider delivered confirmation" }).toBe(true);
  return link;
}
async function login(page: Page, user: Account, next: string) {
  await page.goto("/login?" + new URLSearchParams({ next }));
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(origin + next);
}

test.beforeAll(async ({ browser }) => {
  const users: Account[] = [];
  for (const name of ["MarketRegressionA", "MarketRegressionB"]) {
    const context = await browser.newContext({ baseURL: origin }); contexts.push(context);
    const page = await context.newPage();
    const user = { context, page, name, email: `${randomBytes(12).toString("hex")}@example.test`, password: randomBytes(24).toString("base64url") + "!aA1" };
    await page.goto("/signup?next=%2Fapps");
    await page.getByLabel("Display name", { exact: true }).fill(name);
    await page.getByLabel("Email", { exact: true }).fill(user.email);
    await page.getByLabel("Password", { exact: true }).fill(user.password);
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Check your email", exact: true })).toBeVisible();
    await page.goto(await confirmation(user.email));
    await expect(page).toHaveURL(origin + "/apps");
    await expect(page.getByText(new RegExp("Signed in as " + name))).toBeVisible();
    users.push(user);
  }
  [a,b] = users;
});
test.afterAll(async () => { for (const context of contexts) await context.close(); });

test("ordinary accounts have neither platform administration nor private vault access", async () => {
  for (const user of [a,b]) {
    const response = await user.context.request.get("/api/platform/v1/me"); expect(response.status()).toBe(200);
    expect((await response.json()).data.platform_permissions).toEqual([]);
    expect((await user.context.request.get("/api/superuser/files")).status()).toBe(403);
    expect((await user.context.request.get("/api/apps/orion/v1/context")).status()).toBe(403);
  }
});

test("real browser Market upload, publication, anonymous download and archive", async ({ browser }, info) => {
  const page = a.page; const name = "Isolated Market " + randomUUID();
  const bytes = Buffer.from("MiniKit isolated marketplace regression.\n");
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Publish tool", exact: true }).click();
  await page.getByLabel("Tool name", { exact: true }).fill(name);
  await page.getByLabel("What does it do?", { exact: true }).fill("Deterministic isolated marketplace regression tool.");
  await page.getByLabel("Price in EUR").fill("0"); await page.getByLabel("Windows", { exact: true }).check();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText("Draft created successfully.", { exact: true })).toBeVisible();
  console.error("P2_CHECK_MARKET_DRAFT");
  await page.getByRole("article", { name, exact: true }).getByRole("link", { name: "Manage →" }).click(); const manage = page.url();
  await page.getByLabel("Full description").fill("A deterministic fixture for local storage integration, not a public product.");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText("Tool updated successfully.", { exact: true })).toBeVisible();
  await page.getByLabel("New version").fill("1.0.0"); await page.getByRole("button", { name: "Create", exact: true }).click();
  const version = page.getByRole("article", { name: "Version 1.0.0", exact: true });
  await version.getByLabel("Choose file").setInputFiles({ name: "regression.txt", mimeType: "text/plain", buffer: bytes });
  await version.getByRole("button", { name: "Upload binary", exact: true }).click();
  await expect(version.getByText("Uploaded", { exact: true })).toBeVisible({ timeout: 30000 });
  console.error("P2_CHECK_MARKET_UPLOADED");
  await version.getByRole("button", { name: "Set as current release", exact: true }).click();
  await expect(page.getByText("Current release updated.", { exact: true })).toBeVisible();
  console.error("P2_CHECK_MARKET_RELEASE");
  await page.getByLabel("Release version").selectOption({ label: "1.0.0" });
  await page.getByRole("button", { name: "Publish tool", exact: true }).click();
  await expect(page.getByLabel("Status published")).toBeVisible();
  console.error("P2_CHECK_MARKET_PUBLISHED");
  const publicPath = await page.getByRole("link", { name: "View public page →" }).getAttribute("href");
  if (!publicPath) throw new Error("Published fixture URL missing.");
  const anonymous = await browser.newContext({ baseURL: origin }); contexts.push(anonymous);
  const publicPage = await anonymous.newPage(); await publicPage.goto(publicPath);
  await expect(publicPage.getByRole("heading", { name, exact: true })).toBeVisible();
  const pending = publicPage.waitForEvent("download", { timeout: 15000 });
  await publicPage.getByRole("link", { name: "Download", exact: true }).click();
  const download = await pending; expect(download.suggestedFilename()).toBe("regression.txt");
  const file = info.outputPath("regression.txt"); await download.saveAs(file); expect(await fs.readFile(file)).toEqual(bytes);
  console.error("P2_CHECK_MARKET_DOWNLOADED");
  await b.page.goto(manage); await expect(b.page.getByLabel("Full description")).toHaveCount(0);
  await page.goto(manage); await page.getByRole("button", { name: "Archive tool", exact: true }).click();
  await expect(page.getByLabel("Status archived")).toBeVisible();
  // A failed assertion must remain visible rather than being masked by a failing
  // cleanup click. All database and object data are discarded with this isolated
  // Compose project; this suite cannot run against production.
});

test("real logout clears another tab and the next login belongs only to B", async () => {
  await a.page.goto("/apps"); await expect(a.page.getByText(/Signed in as MarketRegressionA/)).toBeVisible();
  const other = await a.context.newPage(); await other.goto("/apps");
  await expect(other.getByText(/Signed in as MarketRegressionA/)).toBeVisible();
  await a.page.getByRole("button", { name: "Sign out everywhere", exact: true }).click();
  await expect(a.page).toHaveURL(origin + "/");
  await expect(other.getByText(/Signed in as MarketRegressionA/)).toHaveCount(0);
  expect((await a.context.request.get("/api/platform/v1/me")).status()).toBe(401);
  await login(a.page, b, "/apps");
  await expect(a.page.getByText(/Signed in as MarketRegressionB/)).toBeVisible();
  await other.bringToFront(); await other.reload();
  await expect(other.getByText(/Signed in as MarketRegressionB/)).toBeVisible();
  await expect(other.getByText(/Signed in as MarketRegressionA/)).toHaveCount(0);
});
