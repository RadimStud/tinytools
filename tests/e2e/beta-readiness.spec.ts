import { expect, test } from "@playwright/test";

// Read-only: never authenticate, post a form, upload to R2 or create an issue.
test("health endpoints return actual successful JSON probes", async ({ request }) => {
  for (const path of ["/api/health", "/api/db-health"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"], path).toContain("application/json");
    expect((await response.json()).status, path).toBe("ok");
  }
});

for (const path of ["/admin/tools", "/admin/users"]) {
  test(`anonymous ${path} never exposes admin data`, async ({ page, baseURL }) => {
    await page.goto(path);
    await expect(page).toHaveURL(new URL("/login", baseURL!).toString());
    await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  });
}

test("CSV input is cleared by reload and is not transmitted during use", async ({ page }) => {
  const marker = "minikit-private-fixture-91c46a";
  const writes: string[] = [];
  const exposed: string[] = [];
  await page.goto("/workbench/csv-cleaner");
  page.on("request", request => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) writes.push(request.method());
    if (`${request.url()} ${request.postData() || ""}`.includes(marker)) exposed.push(request.method());
  });
  await page.getByLabel("Or paste CSV").fill(`id,note\n001,${marker}\n`);
  await page.getByRole("button", { name: "Clean CSV", exact: true }).click();
  await expect(page.getByRole("cell", { name: marker, exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Or paste CSV")).toHaveValue("");
  await expect(page.getByRole("button", { name: "Download cleaned CSV" })).toHaveCount(0);
  expect(writes).toEqual([]);
  expect(exposed).toEqual([]);
});

test("invalid UTF-8 upload clears stale results without a server upload", async ({ page }) => {
  await page.goto("/workbench/csv-cleaner");
  await page.getByRole("button", { name: "Try sample", exact: true }).click();
  await page.getByRole("button", { name: "Clean CSV", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download cleaned CSV" })).toBeVisible();
  await page.getByLabel("Choose CSV or TSV").setInputFiles({
    name: "invalid.csv", mimeType: "text/csv", buffer: Buffer.from([0xc3, 0x28]),
  });
  await expect(page.getByRole("main").getByRole("alert")).toContainText("UTF-8");
  await expect(page.getByLabel("Or paste CSV")).toHaveValue("");
  await expect(page.getByRole("button", { name: "Download cleaned CSV" })).toHaveCount(0);
});
