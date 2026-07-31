// the everyday direction: whatever you just edited in LibreOffice becomes the csvs the server reads
import fs from "node:fs";
import ExcelJS from "exceljs";
import { invariant } from "@speed-dungeon/common";
import type { BalanceCell, BalanceTable } from "./balance-tables.ts";
import { buildBalanceTables } from "./balance-tables.ts";
import { WORKBOOK_PATH } from "./game-data-paths.ts";
import { writeCsvTables } from "./write-csv-tables.ts";

async function syncCsvFromWorkbook() {
  invariant(
    fs.existsSync(WORKBOOK_PATH),
    `no workbook at ${WORKBOOK_PATH} — run "yarn extract" to create one`
  );

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(WORKBOOK_PATH);

  const tables = buildBalanceTables().map((table) => readTable(workbook, table));

  console.log("wrote csvs:");
  writeCsvTables(tables);
}

/** the table built from the code supplies the expected sheet name and column order, so a renamed
 * column or a dropped sheet fails here rather than silently emptying a csv */
function readTable(workbook: ExcelJS.Workbook, expected: BalanceTable): BalanceTable {
  const worksheet = workbook.getWorksheet(expected.name);
  invariant(worksheet !== undefined, `workbook has no "${expected.name}" sheet`);

  const headerRow = worksheet.getRow(1);
  const columns = expected.columns.map((column, index) => {
    const header = readCell(headerRow.getCell(index + 1));
    invariant(
      header === column,
      `${expected.name} column ${index + 1} is "${header}", expected "${column}"`
    );
    return column;
  });

  const rows: Record<string, BalanceCell>[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }
    const cellsByColumn: Record<string, BalanceCell> = {};
    let hasValue = false;
    columns.forEach((column, index) => {
      const cell = readCell(row.getCell(index + 1));
      cellsByColumn[column] = cell;
      if (cell !== null) {
        hasValue = true;
      }
    });
    if (hasValue) {
      rows.push(cellsByColumn);
    }
  });

  return { name: expected.name, columns, rows };
}

/** formula cells carry both the formula and its last computed result, and the result is what the
 * game should read */
function readCell(cell: ExcelJS.Cell): BalanceCell {
  const { value } = cell;

  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }
  if (typeof value === "object" && "result" in value) {
    const { result } = value;
    invariant(
      result !== undefined,
      `${cell.worksheet.name}!${cell.address} holds an uncalculated formula — open the workbook, ` +
        `let it recalculate, and save`
    );
    invariant(
      typeof result === "number" || typeof result === "string",
      `${cell.worksheet.name}!${cell.address} formula produced ${JSON.stringify(result)}`
    );
    return result;
  }

  throw new Error(`${cell.worksheet.name}!${cell.address} holds an unsupported value type`);
}

await syncCsvFromWorkbook();
