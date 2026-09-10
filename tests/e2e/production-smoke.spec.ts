import fs from "node:fs";
import path from "node:path";

import {
  expect,
  test,
  type Page,
} from "@playwright/test";

import {
  requireE2ECredentials,
} from "./helpers/credentials";

const smokeFilePath =
  path.join(
    process.cwd(),
    "tests",
    "e2e",
    "fixtures",
    "smoke-file.txt",
  );

const expectedSmokeText =
  fs.readFileSync(
    smokeFilePath,
    "utf8",
  );

test.describe.configure({
  mode: "serial",
});

test.describe("Production smoke", () => {
  test("developer can publish a free tool and download it", async ({
    page,
  }, testInfo) => {
    const credentials =
      requireE2ECredentials();
    const toolName =
      `E2E Smoke ${Date.now()}`;

    let managementUrl:
      | string
      | null = null;

    try {
      await login(
        page,
        credentials,
      );

      await createDraft(
        page,
        toolName,
      );

      managementUrl =
        await openCreatedTool(
          page,
          toolName,
        );

      await addPublishableDescription(
        page,
      );

      await createVersion(
        page,
      );

      await uploadBinary(
        page,
      );

      await setCurrentRelease(
        page,
      );

      await publishDraft(
        page,
        toolName,
      );

      await verifyPublicPageAndDownload(
        page,
        toolName,
        testInfo.outputDir,
      );
    } finally {
      await archiveGeneratedTool(
        page,
        managementUrl,
      );
    }
  });
});

async function login(
  page: Page,
  credentials: {
    email: string;
    password: string;
  },
) {
  await page.goto("/login");

  await page
    .getByLabel("Email")
    .fill(credentials.email);

  await page
    .getByLabel("Password")
    .fill(
      credentials.password,
    );

  await page
    .getByRole("button", {
      name: "Sign in",
    })
    .click();

  await expect(page).toHaveURL(
    /\/dashboard/,
  );

  await expect(
    page.getByRole("heading", {
      name: "Your tools",
    }),
  ).toBeVisible();
}

async function createDraft(
  page: Page,
  toolName: string,
) {
  await page
    .getByRole("link", {
      name: "Publish tool",
    })
    .click();

  await expect(page).toHaveURL(
    /\/publish/,
  );

  await page
    .getByLabel("Tool name")
    .fill(toolName);

  await page
    .getByLabel(
      "What does it do?",
    )
    .fill(
      "Automated smoke test tool for MiniKit Market downloads.",
    );

  await page
    .getByLabel("Price in EUR")
    .fill("0");

  await page
    .getByLabel("Windows")
    .check();

  await page
    .getByRole("button", {
      name: "Save draft",
    })
    .click();

  await expect(page).toHaveURL(
    /\/dashboard\?created=1/,
  );

  await expect(
    page.getByText(
      "Draft created successfully.",
      {
        exact: true,
      },
    ),
  ).toBeVisible();
}

async function openCreatedTool(
  page: Page,
  toolName: string,
) {
  const card =
    page.getByRole(
      "article",
      {
        name: toolName,
      },
    );

  await expect(
    card.getByRole("heading", {
      name: toolName,
      exact: true,
    }),
  ).toBeVisible();

  await card
    .getByRole("link", {
      name: "Manage →",
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: toolName,
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByLabel(
      "Status draft",
    ),
  ).toBeVisible();

  return page.url();
}

async function addPublishableDescription(
  page: Page,
) {
  await page
    .getByLabel(
      "Full description",
    )
    .fill(
      "MiniKit Market E2E smoke test full description for publishing.",
    );

  await page
    .getByRole("button", {
      name: "Save changes",
    })
    .click();

  await expect(
    page.getByText(
      "Tool updated successfully.",
      {
        exact: true,
      },
    ),
  ).toBeVisible();
}

async function createVersion(
  page: Page,
) {
  await page
    .getByLabel("New version")
    .fill("1.0.0");

  await page
    .getByRole("button", {
      name: "Create",
    })
    .click();

  await expect(
    page.getByText(
      "Version created successfully.",
      {
        exact: true,
      },
    ),
  ).toBeVisible();

  await expect(
    page.getByRole("article", {
      name: "Version 1.0.0",
    }),
  ).toBeVisible();
}

async function uploadBinary(
  page: Page,
) {
  const versionCard =
    page.getByRole(
      "article",
      {
        name: "Version 1.0.0",
      },
    );

  await versionCard
    .getByLabel("Choose file")
    .setInputFiles(
      smokeFilePath,
    );

  await versionCard
    .getByRole("button", {
      name: "Upload binary",
    })
    .click();

  await expect(
    versionCard.getByText(
      "Uploaded",
      {
        exact: true,
      },
    ),
  ).toBeVisible({
    timeout: 120_000,
  });

  await expect(
    versionCard.getByText(
      /SHA-256:/,
    ),
  ).toBeVisible();
}

async function setCurrentRelease(
  page: Page,
) {
  const versionCard =
    page.getByRole(
      "article",
      {
        name: "Version 1.0.0",
      },
    );

  await versionCard
    .getByRole("button", {
      name: "Set as current release",
    })
    .click();

  await expect(
    page.getByText(
      "Current release updated.",
      {
        exact: true,
      },
    ),
  ).toBeVisible();

  const currentRelease =
    page.getByRole("region", {
      name: "Current release details",
    });

  await expect(
    currentRelease.getByText(
      "1.0.0",
      {
        exact: true,
      },
    ),
  ).toBeVisible();
}

async function publishDraft(
  page: Page,
  toolName: string,
) {
  await page
    .getByLabel(
      "Release version",
    )
    .selectOption({
      label: "1.0.0",
    });

  await page
    .getByRole("button", {
      name: "Publish tool",
    })
    .click();

  await expect(
    page.getByText(
      "Tool published successfully.",
      {
        exact: true,
      },
    ),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: toolName,
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByLabel(
      "Status published",
    ),
  ).toBeVisible();
}

async function verifyPublicPageAndDownload(
  page: Page,
  toolName: string,
  outputDir: string,
) {
  await page
    .getByRole("link", {
      name: "View public page →",
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: toolName,
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByText("Free", {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByText(
      /Current release:\s*1\.0\.0/,
    ),
  ).toBeVisible();

  await expect(
    page.getByText("windows", {
      exact: true,
    }),
  ).toBeVisible();

  const downloadPromise =
    page.waitForEvent(
      "download",
      {
        timeout: 120_000,
      },
    );

  await page
    .getByRole("link", {
      name: "Download",
    })
    .click();

  const download =
    await downloadPromise;

  expect(
    download.suggestedFilename(),
  ).toBe("smoke-file.txt");

  const downloadPath =
    path.join(
      outputDir,
      "smoke-file.txt",
    );

  await download.saveAs(
    downloadPath,
  );

  const downloadedText =
    fs.readFileSync(
      downloadPath,
      "utf8",
    );

  expect(downloadedText).toBe(
    expectedSmokeText,
  );
}

async function archiveGeneratedTool(
  page: Page,
  managementUrl: string | null,
) {
  if (!managementUrl) {
    return;
  }

  await page.goto(
    managementUrl,
  );

  const archiveButton =
    page.getByRole("button", {
      name: "Archive tool",
    });

  if (
    !(await archiveButton.isVisible())
  ) {
    await expect(
      page.getByLabel(
        "Status archived",
      ),
    ).toBeVisible();

    return;
  }

  await archiveButton.click();

  await expect(
    page.getByText(
      "Tool archived.",
      {
        exact: true,
      },
    ),
  ).toBeVisible();

  await expect(
    page.getByLabel(
      "Status archived",
    ),
  ).toBeVisible();
}
