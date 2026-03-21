import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
