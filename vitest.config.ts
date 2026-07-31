import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import { fileURLToPath } from "url";
import { config as readEnvFile } from "dotenv";

// tests import server code that validates its environment at import time, and the server loads its
// own .env relative to the cwd — so from anywhere but packages/server there was nothing to load and
// envalid exited the process. loading it here, resolved from this file rather than the cwd, is what
// lets the suite run from the repo root
const { parsed: serverEnvOption } = readEnvFile({
  path: path.join(fileURLToPath(import.meta.url), "../packages/server/.env"),
});

// NODE_ENV is dropped rather than injected: the file says "development" and a test run is a test run.
// vitest sets it to "test", which validate-env accepts, and nothing branches on the difference —
// only on "production"
const { NODE_ENV, ...serverEnvForTests } = serverEnvOption ?? {};

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
    // handed to the workers explicitly rather than relying on them inheriting this process's env
    env: serverEnvForTests,
    include: ["packages/**/src/**/*.test.ts"],
    // Show full error stack traces
    silent: false,
    // Run tests in full verbose mode
    reporters: "verbose",
    testTimeout: 5000,
    poolOptions: { threads: { maxThreads: 4, minThreads: 1 } },
  },
});
