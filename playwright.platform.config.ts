import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/platform/browser", testMatch: "session.spec.ts", workers: 1, retries: 0,
  timeout: 30_000, forbidOnly: true, outputDir: "test-results/platform-browser",
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report/platform-browser" }]],
  use: { baseURL: "http://127.0.0.1:3101", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [{ name: "isolated-session-chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "node node_modules/vite/bin/vite.js --config=tests/platform/browser/vite.config.ts", url: "http://127.0.0.1:3101", reuseExistingServer: false, timeout: 60_000 },
});
