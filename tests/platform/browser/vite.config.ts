import path from "node:path";
import { defineConfig } from "vite";
export default defineConfig({
  root: path.resolve(process.cwd(), "tests/platform/browser"),
  esbuild: { jsx: "automatic" },
  server: { host: "127.0.0.1", port: 3101, strictPort: true, fs: { allow: [process.cwd()] } },
});
