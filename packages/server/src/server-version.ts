import { APP_VERSION_NUMBER } from "@speed-dungeon/common";

import fs from "fs";
// we care about the version because when we save characters and games
// we want to know what version of the game they were from
const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));
if (!packageJson.version || typeof packageJson.version !== "string") {
  console.error("unknown version number");
  process.exit(1);
}
export const SERVER_VERSION: string = APP_VERSION_NUMBER;
