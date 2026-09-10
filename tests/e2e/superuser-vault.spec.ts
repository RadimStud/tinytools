import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { requireE2ECredentials } from "./helpers/credentials";

test("superuser can upload, download and delete a private file", async ({ page }, testInfo) => {
  test.skip(process.env.E2E_SUPERUSER !== "1", "Opt in with E2E_SUPERUSER=1 and owner credentials after migration.");
  const credentials = requireE2ECredentials();
  const name = `vault-e2e-${randomUUID()}.txt`;
  const content = "MiniKit private vault round-trip test.\n";
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(credentials.email);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByRole("link", { name: "Superuser", exact: true }).click();
  await expect(page).toHaveURL(/\/superuser$/);
  const origin = new URL(page.url()).origin;
  try {
    await page.getByLabel("Choose vault files").setInputFiles({ name, mimeType: "text/plain", buffer: Buffer.from(content) });
    const row = page.getByRole("article", { name, exact: true });
    const link = row.getByRole("link", { name: `Download ${name}`, exact: true });
    await expect(link).toBeVisible({ timeout: 120_000 });
    const downloadEvent = page.waitForEvent("download");
    await link.click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe(name);
    const local = path.join(testInfo.outputDir, name);
    await download.saveAs(local);
    expect(await fs.readFile(local, "utf8")).toBe(content);
    page.once("dialog", dialog => dialog.accept());
    await row.getByRole("button", { name: `Delete ${name}`, exact: true }).click();
    await expect(row).toHaveCount(0);
  } finally {
    const response = await page.request.get("/api/superuser/files");
    if (response.ok()) {
      const { files } = await response.json();
      for (const file of files.filter((entry: { name: string }) => entry.name === name)) {
        const result = await page.request.delete(`/api/superuser/files/${file.id}`, { headers: { Origin: origin } });
        expect(result.ok(), "Vault test cleanup").toBeTruthy();
      }
    }
  }
});
