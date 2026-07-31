import fs from "node:fs";
import Papa from "papaparse";
import type { BalanceTable } from "./balance-tables.ts";
import { CSV_DIRECTORY, getCsvPath } from "./game-data-paths.ts";

export function writeCsvTables(tables: BalanceTable[]) {
  fs.mkdirSync(CSV_DIRECTORY, { recursive: true });

  for (const table of tables) {
    const csv = Papa.unparse(table.rows, { columns: table.columns, newline: "\n" });
    fs.writeFileSync(getCsvPath(table.name), `${csv}\n`);
    console.log(`  ${table.name}.csv (${table.rows.length} rows)`);
  }
}
