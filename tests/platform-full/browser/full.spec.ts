import fs from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import postgres from "postgres";

// This suite uses disposable accounts and local providers only. Never load application dotenv files.
const config = JSON.parse(fs.readFileSync(".p2-local/test.json", "utf8"));
const db = new URL(config.DATABASE_URL);
if (db.hostname !== "127.0.0.1" || db.port !== "54329" || db.pathname !== "/minikit_platform_e2e" || config.MINIKIT_DEPLOYMENT_ENV !== "isolated-test") throw new Error("Disposable local environment required.");
const sql = postgres(config.DATABASE_URL, { max: 2, prepare: false });
const origin = "http://127.0.0.1:3100";
type Account = { context: BrowserContext; page: Page; email: string; password: string; subject: string };
const contexts: BrowserContext[] = [];
let a: Account, b: Account, operator: Account;
test.describe.configure({ mode: "serial" });

async function mailLink(email: string, subject: string) {
  let result = "";
  await expect.poll(async () => {
    const inbox = await (await fetch("http://127.0.0.1:54324/api/v1/messages")).json();
    const message = inbox.messages?.find((m: { To: { Address: string }[]; Subject: string }) => m.To.some(x => x.Address === email) && m.Subject.toLowerCase().includes(subject));
    if (!message) return false;
    const details = await (await fetch(`http://127.0.0.1:54324/api/v1/message/${message.ID}`)).json();
    const link = String(details.HTML).match(/href="([^"]+)"/)?.[1]?.replaceAll("&amp;", "&");
    if (!link) return false;
    const u = new URL(link);
    if (u.origin !== "http://127.0.0.1:54321" || u.pathname !== "/auth/v1/verify") throw new Error("Unexpected local email link.");
    result = link; return true;
  }, { timeout: 30000, message: "Local Auth provider delivered the requested email" }).toBe(true);
  return result;
}
async function signup(browser: Browser, name: string): Promise<Account> {
  const context = await browser.newContext({ baseURL: origin }); contexts.push(context);
  const page = await context.newPage();
  const email = `${name.toLowerCase()}-${randomBytes(6).toString("hex")}@example.test`;
  const password = randomBytes(24).toString("base64url") + "!aA1";
  await page.goto("/signup?next=%2Fapps");
  await page.getByLabel("Display name", { exact: true }).fill(name);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Check your email", exact: true })).toBeVisible();
  const rows = await sql`SELECT id, email_confirmed_at FROM auth.users WHERE email=${email}`;
  expect(rows).toHaveLength(1); expect(rows[0].email_confirmed_at).toBeNull();
  await page.goto(await mailLink(email, "confirm"));
  await expect(page).toHaveURL(origin + "/apps");
  await expect(page.getByRole("heading", { name: "My apps", exact: true })).toBeVisible();
  const response = await context.request.get("/api/platform/v1/me"); expect(response.status()).toBe(200);
  const me = (await response.json()).data;
  expect(me.subject).toBe(rows[0].id); expect(me.platform_permissions).toEqual([]);
  expect(await sql`SELECT id FROM public.users WHERE auth_user_id=${me.subject}`).toHaveLength(1);
  return { context, page, email, password, subject: me.subject };
}
async function access(subject: string, status: string, version: number) {
  const response = await operator.context.request.put("/api/platform/v1/admin/access", {
    headers: { Origin: origin }, data: { subject, app_id: "orion", status, app_role: "user", expected_policy_version: version, reason: "Disposable two-account integration test" },
  });
  expect(response.status()).toBe(200);
}
const gateway = "/api/apps/orion/v1";
const headers = (key = randomUUID()) => ({ Origin: origin, "Idempotency-Key": key });
test.afterAll(async () => { for (const c of contexts) await c.close(); await sql.end(); });

test("real signup and delivered confirmation preserve two separate identities", async ({ browser }) => {
  a = await signup(browser, "AccountA"); b = await signup(browser, "AccountB"); operator = await signup(browser, "Operator");
  expect(a.subject).not.toBe(b.subject);
  expect((await a.context.request.get(gateway + "/context")).status()).toBe(403);
  expect((await a.context.request.put("/api/platform/v1/admin/access", { headers: { Origin: origin }, data: {} })).status()).toBe(403);
  await sql`INSERT INTO public.platform_admins(auth_user_id,reason) VALUES (${operator.subject},'Disposable local test operator')`;
});

test("enabled portal administration grants A via the actual UI while B remains denied", async () => {
  await operator.page.goto("/platform/admin?" + new URLSearchParams({ subject: a.subject }));
  const form = operator.page.getByRole("form", { name: "Access to ORION" });
  await form.getByLabel("Access", { exact: true }).selectOption("enabled");
  await form.getByLabel("Reason (no private data)").fill("Disposable integration access for A");
  const submitted = operator.page.waitForResponse(r => new URL(r.url()).pathname === "/api/platform/v1/admin/access" && r.request().method() === "PUT", { timeout: 15000 });
  await form.getByRole("button", { name: "Save access" }).click();
  const mutation = await submitted;
  console.error("P2_CHECK_ADMIN_HTTP_" + mutation.status());
  const mutationData = await mutation.json();
  const code = mutationData.error?.code;
  if (typeof code === "string" && /^[a-z_]{1,60}$/.test(code)) console.error("P2_CHECK_ADMIN_" + code.toUpperCase());
  expect(mutation.status()).toBe(200);
  await expect(form).toContainText("Current policy version: 1");
  expect((await a.context.request.get(gateway + "/context")).status()).toBe(200);
  expect((await b.context.request.get(gateway + "/context")).status()).toBe(403);
  await access(b.subject, "enabled", 0);
});

test("gateway and separate fixture return the verified identity of each account", async () => {
  for (const user of [a,b]) {
    const response = await user.context.request.get(gateway + "/context"); expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    const body = await response.json(); expect(body.data.subject).toBe(user.subject);
    expect(body.data.paid_operations_enabled).toBe(false); expect(body.data.limits).toBeNull();
  }
  const jwks = await (await a.context.request.get("/api/platform/v1/jwks")).json();
  expect(jwks.keys).toHaveLength(1); expect(jwks.keys[0]).not.toHaveProperty("d");
});

test("queued jobs are account-owned and repeated creates are idempotent", async () => {
  const key = randomUUID(); const input = { operation: "contract.echo", input: { text: "Synthetic account A result" } };
  const create = () => a.context.request.post(gateway + "/jobs", { headers: headers(key), data: input });
  const first = await create(); expect(first.status()).toBe(200); const job = (await first.json()).data;
  expect(job.state).toBe("queued"); expect((await (await create()).json()).data.id).toBe(job.id);
  expect((await b.context.request.get(gateway + "/jobs/" + job.id)).status()).toBe(404);
  const completed = await a.context.request.post(gateway + "/jobs/" + job.id + "/run", { headers: headers(), data: {} });
  expect(completed.status()).toBe(200); expect((await completed.json()).data.output).toEqual(input.input);
  const changed = await a.context.request.post(gateway + "/jobs", { headers: headers(key), data: { ...input, input: { text: "Changed" } } });
  expect(changed.status()).toBe(409);
});

test("revocation blocks new and queued operations without changing B access", async () => {
  const response = await a.context.request.post(gateway + "/jobs", { headers: headers(), data: { operation: "contract.echo", input: { text: "Queued" } } });
  const job = (await response.json()).data;
  await access(a.subject, "suspended", 1);
  expect((await a.context.request.get(gateway + "/context")).status()).toBe(403);
  expect((await a.context.request.post(gateway + "/jobs/" + job.id + "/run", { headers: headers(), data: {} })).status()).toBe(403);
  expect((await b.context.request.get(gateway + "/context")).status()).toBe(200);
  await access(a.subject, "enabled", 2);
});

test("real recovery email updates a password without creating another account", async ({ browser }) => {
  const c = await browser.newContext({ baseURL: origin }); contexts.push(c); const page = await c.newPage();
  await page.goto("/forgot-password"); await page.getByLabel("Email", { exact: true }).fill(b.email);
  await page.getByRole("button", { name: "Send recovery link", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("a link has been requested");
  await page.goto(await mailLink(b.email, "reset"));
  await expect(page.getByRole("heading", { name: "Change password", exact: true })).toBeVisible();
  b.password = randomBytes(24).toString("base64url") + "!aA1";
  await page.getByLabel("New password", { exact: true }).fill(b.password);
  await page.getByLabel("Confirm password", { exact: true }).fill(b.password);
  await page.getByRole("button", { name: "Update password", exact: true }).click();
  await expect(page.getByText("Password updated.", { exact: true })).toBeVisible();
  const me = (await (await c.request.get("/api/platform/v1/me")).json()).data; expect(me.subject).toBe(b.subject);
});

test("ordinary accounts cannot use the owner vault and ORION stays coming soon", async () => {
  for (const user of [a,b,operator]) expect((await user.context.request.get("/api/superuser/files")).status()).toBe(403);
  const catalog = (await (await a.context.request.get("/api/platform/v1/apps")).json()).data;
  expect(catalog.find((x: {app_id: string}) => x.app_id === "orion")).toMatchObject({ launch_path: null, display_state: "coming_soon" });
});
