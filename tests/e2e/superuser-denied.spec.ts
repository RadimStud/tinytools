import { expect, test } from "@playwright/test";

test("signed-in account without superuser cannot access the private vault", async ({ page }) => {
  test.skip(process.env.E2E_NON_SUPERUSER !== "1", "Opt in with E2E_NON_SUPERUSER=1 and a separate account without superuser permission.");
  const email = process.env.E2E_NON_SUPERUSER_EMAIL?.trim();
  const password = process.env.E2E_NON_SUPERUSER_PASSWORD;
  if (!email || !password) throw new Error("Set E2E_NON_SUPERUSER_EMAIL and E2E_NON_SUPERUSER_PASSWORD to an account without superuser permission.");

  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Your tools", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Superuser", exact: true })).toHaveCount(0);

  await page.goto("/superuser");
  await expect(page).toHaveURL(/\/dashboard$/);
  const root = "/api/superuser/files";
  const id = "3017e909-c615-44c4-a548-c4b1f9763358";
  const options = { headers: { Origin: new URL(page.url()).origin } };
  // page.request shares the authenticated browser cookies.
  const responses = [
    await page.request.get(root),
    await page.request.post(root, { ...options, data: { name: "access-check.txt", size: 12 } }),
    await page.request.post(`${root}/${id}`, options),
    await page.request.delete(`${root}/${id}`, options),
    await page.request.get(`${root}/${id}/download`, { maxRedirects: 0 }),
  ];
  for (const response of responses) {
    expect(response.status(), response.url()).toBe(403);
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
});
