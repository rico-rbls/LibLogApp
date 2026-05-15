import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "tests/unit/**/*.test.ts",
      "tests/pbt/**/*.test.ts",
      "tests/utils/**/*.test.ts",
    ],
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@tests": path.resolve(__dirname, "tests"),
      "@tests/utils": path.resolve(__dirname, "tests/utils"),
    },
  },
});
