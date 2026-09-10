import path from "node:path";

import {
  defineConfig,
  devices,
} from "@playwright/test";

import dotenv from "dotenv";

dotenv.config({
  path: ".env.e2e",
});

dotenv.config({
  path: ".env.local",
});

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  expect: {
    timeout: 20_000,
  },
  reporter: "list",
  use: {
    baseURL:
      process.env.E2E_BASE_URL ??
      "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 60_000,
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  outputDir: path.join(
    "test-results",
  ),
});
