import { expect, test } from "@playwright/test";

test("feedback is an explicit public link and never includes CSV contents", async ({ page }) => {
  await page.goto("/workbench/csv-cleaner");
  await page.getByLabel("Or paste CSV").fill("id,note\n001,synthetic-feedback-marker\n");
  await page.getByRole("button", { name: "Clean CSV", exact: true }).click();
  const feedback = page.getByRole("link", { name: "Give CSV Cleaner feedback", exact: true });
  await expect(feedback).toHaveAttribute("href", "https://github.com/RadimStud/tinytools/issues/new?template=csv-feedback.yml");
  await expect(page.getByText("Feedback is public on GitHub. Nothing from your CSV is attached automatically.", { exact: true })).toBeVisible();
  expect(await feedback.getAttribute("href")).not.toContain("synthetic-feedback-marker");
  // Do not follow the link or submit anything to GitHub during tests.
});
