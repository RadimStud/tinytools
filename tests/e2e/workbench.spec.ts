import fs from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("sample cleans and downloads without transmitting its contents", async ({ page }, testInfo) => {
  const leaked: string[] = [];
  page.on("request", request => {
    if (`${request.url()} ${request.postData() || ""}`.includes("alice@example.com")) leaked.push(request.url());
  });
  await page.goto("/workbench/csv-cleaner");
  await page.getByRole("button", { name: "Try sample", exact: true }).click();
  await page.getByRole("button", { name: "Clean CSV", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("5 input rows → 3 output rows");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download cleaned CSV" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("sample-cleaned.csv");
  const file = testInfo.outputPath("sample-cleaned.csv");
  await download.saveAs(file);
  expect(await fs.readFile(file, "utf8")).toBe("\uFEFFname,email,team\r\nAlice,alice@example.com,QA\r\nBob,bob@example.com,Dev");
  expect(leaked).toEqual([]);
  await page.getByLabel("Trim cell spaces", { exact: true }).uncheck();
  await expect(page.getByRole("button", { name: "Download cleaned CSV" })).toHaveCount(0);
});

test("semicolon file preserves identifiers and quoted cells", async ({ page }) => {
  await page.goto("/workbench/csv-cleaner");
  await page.getByLabel("Choose CSV or TSV").setInputFiles({ name: "example.csv", mimeType: "text/csv", buffer: Buffer.from('id;name\r\n001;"Žluťoučký; kůň"\r\n') });
  await expect(page.getByLabel("Or paste CSV")).toHaveValue(/001/);
  await page.getByLabel("Separator").selectOption(";");
  await page.getByRole("button", { name: "Clean CSV", exact: true }).click();
  await expect(page.getByRole("cell", { name: "001", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Žluťoučký; kůň", exact: true })).toBeVisible();
});

test("malformed input cannot produce a stale download", async ({ page }) => {
  await page.goto("/workbench/csv-cleaner");
  await page.getByRole("button", { name: "Try sample" }).click();
  await page.getByRole("button", { name: "Clean CSV", exact: true }).click();
  await page.getByLabel("Or paste CSV").fill('a,b\n"unclosed');
  await page.getByRole("button", { name: "Clean CSV", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("not closed");
  await expect(page.getByRole("button", { name: "Download cleaned CSV" })).toHaveCount(0);
});

test("community links point to the actual public repository", async ({ page }) => {
  await page.goto("/community");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bring a problem.");
  await expect(page.getByRole("link", { name: "Suggest a tool on GitHub" })).toHaveAttribute("href", "https://github.com/RadimStud/tinytools/issues/new?template=tool-idea.yml");
  await page.getByRole("link", { name: "Try CSV Cleaner" }).click();
  await expect(page).toHaveURL(/\/workbench\/csv-cleaner$/);
});

test("workbench remains usable at mobile and desktop widths", async ({ page }, testInfo) => {
  await page.goto("/workbench/csv-cleaner");
  await page.getByRole("button", { name: "Try sample" }).click();
  await page.getByRole("button", { name: "Clean CSV", exact: true }).click();
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Download cleaned CSV" }).click({ trial: true });
    await page.screenshot({ path: testInfo.outputPath(`csv-${width}.png`), fullPage: true });
  }
});
