import fs from "node:fs";
import { defineConfig, devices } from "@playwright/test";
const config = JSON.parse(fs.readFileSync(".p2-local/test.json", "utf8"));
if (config.MINIKIT_DEPLOYMENT_ENV !== "isolated-test" || config.MINIKIT_PLATFORM_ORIGIN !== "http://127.0.0.1:3100") throw new Error("Isolated configuration required.");
export default defineConfig({
  testDir: "./tests/platform-full/browser", workers: 1, fullyParallel: false, retries: 0, timeout: 90000,
  expect: { timeout: 15000 }, forbidOnly: true,
  reporter: [["./tests/platform-full/status-reporter.ts"]],
  outputDir: "test-results/platform-full",
  use: { baseURL: config.MINIKIT_PLATFORM_ORIGIN, trace: "off", screenshot: "off", video: "off" },
  // Actual provider cookies and recovery links must not appear in published artifacts.
  projects: [{ name: "real-provider-chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "node scripts/p2-local.mjs serve", url: "http://127.0.0.1:3100/api/health", timeout: 90000, reuseExistingServer: false },
});
