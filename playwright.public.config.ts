import { defineConfig, devices } from "@playwright/test";

// Deliberately do not import the general config or load .env/.env.local:
// public checks need neither a database URL nor authenticated browser state.
const target = new URL(process.env.E2E_PUBLIC_BASE_URL || "https://tinytools-ten.vercel.app");
const local = ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
if (
  target.username || target.password || target.search || target.hash || target.pathname !== "/" ||
  (!local && target.origin !== "https://tinytools-ten.vercel.app") ||
  !["http:", "https:"].includes(target.protocol)
) throw new Error("Public checks require the MiniKit production origin or a localhost origin.");

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["public.spec.ts", "workbench.spec.ts", "beta-readiness.spec.ts"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  outputDir: "test-results/public",
  reporter: [["list"], ["html", { outputFolder: "playwright-report/public", open: "never" }]],
  use: {
    baseURL: target.origin,
    storageState: { cookies: [], origins: [] },
    acceptDownloads: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "public-chromium", use: { ...devices["Desktop Chrome"] } }],
});
