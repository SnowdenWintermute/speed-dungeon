import path from "node:path";

export const PACKAGE_ROOT = path.join(import.meta.dirname, "..", "..");

export const WORKBOOK_PATH = path.join(PACKAGE_ROOT, "game-data.xlsx");

// what every module the sync writes names as its origin
export const WORKBOOK_SOURCE = "packages/balance-tools/game-data.xlsx";
export const WORKBOOK_SYNC_COMMAND = "yarn workspace @speed-dungeon/balance-tools sync";
