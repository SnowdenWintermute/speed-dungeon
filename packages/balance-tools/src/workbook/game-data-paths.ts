import path from "node:path";

export const PACKAGE_ROOT = path.join(import.meta.dirname, "..", "..");

export const WORKBOOK_PATH = path.join(PACKAGE_ROOT, "game-data.xlsx");
