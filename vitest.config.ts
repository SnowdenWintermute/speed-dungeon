import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Show full error stack traces
    silent: false,
    // Run tests in full verbose mode
    reporters: "verbose",
  },
});
