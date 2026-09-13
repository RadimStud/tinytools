import path from "node:path";
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { environment: "node", include: ["tests/platform/**/*.test.ts"], fileParallelism: false, testTimeout: 15000, hookTimeout: 30000 },
  resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
});
