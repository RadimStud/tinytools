import { expect, test } from "@playwright/test";

test("private vault redirects anonymous visitors", async ({ page }) => {
  await page.goto("/superuser");
  await expect(page).toHaveURL(/\/login$/);
});

test("private vault API rejects anonymous list, uploads and file operations", async ({ request, baseURL }) => {
  const base = baseURL!;
  const root = "/api/superuser/files";
  const id = "3017e909-c615-44c4-a548-c4b1f9763358";
  expect((await request.get(root)).status()).toBe(401);
  const options = { headers: { Origin: new URL(base).origin } };
  expect((await request.post(root, { ...options, data: { name: "test.txt", size: 12 } })).status()).toBe(401);
  expect((await request.post(`${root}/${id}`, options)).status()).toBe(401);
  expect((await request.delete(`${root}/${id}`, options)).status()).toBe(401);
  expect((await request.get(`${root}/${id}/download`, { maxRedirects: 0 })).status()).toBe(401);
});
