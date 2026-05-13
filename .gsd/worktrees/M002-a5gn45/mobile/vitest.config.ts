import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(configDir, "..");

export default defineConfig({
  test: {
    environment: "node",
    include: ["mobile/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@mobile": path.resolve(repoRoot, "mobile"),
    },
  },
});
