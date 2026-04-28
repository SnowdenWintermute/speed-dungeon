import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
export default defineConfig({
    // MIKE'S EXPLANATION
    // lets us use imports like @/client-application when they are aliased like ../../client-application/*
    // instead of as actually built packages from dist
    // CHAT-GPT's EXPLANATION
    // // This plugin makes Vitest/Vite respect our TypeScript path aliases.
    // Allows imports like `@/client-application` to resolve directly to the source files
    // (e.g., ../client-application/src/*) instead of requiring built outputs from `dist`.
    // Effectively flattens the packages for testing, bypassing project references.
    plugins: [tsconfigPaths()],
    test: {
        globals: true,
        environment: "node",
        include: ["packages/**/src/**/*.test.ts"],
        // Show full error stack traces
        silent: false,
        // Run tests in full verbose mode
        reporters: "verbose",
        testTimeout: 3000,
    },
});
//# sourceMappingURL=vitest.config.js.map