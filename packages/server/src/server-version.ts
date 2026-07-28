import { APP_VERSION_NUMBER } from "@speed-dungeon/common";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
// we care about the version because when we save characters and games
// we want to know what version of the game they were from.
// resolved relative to this module rather than to the cwd: this package's own version is not a fact
// about where the process was started from, and reading "./package.json" made every importer of the
// server barrel — the integration tests included — only work when run from packages/server
const packageJsonPath = path.join(fileURLToPath(import.meta.url), "../../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
if (!packageJson.version || typeof packageJson.version !== "string") {
  console.error("unknown version number");
  process.exit(1);
}
export const SERVER_VERSION: string = APP_VERSION_NUMBER;
