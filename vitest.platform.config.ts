import path from "node:path";
import { defineConfig } from "vitest/config";

// Reject driver query overrides before collecting any destructive fixture tests.
const target = new URL(process.env.PLATFORM_TEST_DATABASE_URL ?? "http://invalid");
if (!["postgres:", "postgresql:"].includes(target.protocol) ||
    !["127.0.0.1", "localhost", "[::1]"].includes(target.hostname) ||
    target.pathname !== "/minikit_platform_test" || target.search || target.hash) {
  throw new Error("Isolated tests require a plain loopback minikit_platform_test URL with no query or fragment. Never use a real account database.");
}
export default defineConfig({
  test: { environment: "node", include: ["tests/platform/**/*.test.ts"], fileParallelism: false, testTimeout: 15000, hookTimeout: 30000 },
  resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
});
