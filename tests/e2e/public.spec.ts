import {
  expect,
  test,
} from "@playwright/test";

test.describe("Public read-only pages", () => {
  test("homepage responds", async ({
    page,
  }) => {
    const response =
      await page.goto("/");

    expect(
      response?.ok(),
    ).toBeTruthy();

    await expect(
      page.getByText(
        "MiniKit",
        {
          exact: true,
        },
      ).first(),
    ).toBeVisible();
  });

  test("search page responds", async ({
    page,
  }) => {
    const response =
      await page.goto(
        "/search",
      );

    expect(
      response?.ok(),
    ).toBeTruthy();

    await expect(
      page.getByRole(
        "heading",
        {
          name: "Find a tool",
        },
      ),
    ).toBeVisible();
  });

  test("admin redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(
      /\/login$/,
    );
  });

  test("dashboard redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto(
      "/dashboard",
    );

    await expect(page).toHaveURL(
      /\/login$/,
    );
  });
});
