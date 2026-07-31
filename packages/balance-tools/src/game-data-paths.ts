import path from "node:path";

const PACKAGE_ROOT = path.join(import.meta.dirname, "..");

export const WORKBOOK_PATH = path.join(PACKAGE_ROOT, "game-data.xlsx");
export const CSV_DIRECTORY = path.join(PACKAGE_ROOT, "..", "server", "game-data");

export function getCsvPath(tableName: string) {
  return path.join(CSV_DIRECTORY, `${tableName}.csv`);
}
