// regenerates the balance workbook from the values still living in the code. this overwrites hand
// authored formulas and formatting, so it refuses to clobber an existing workbook without --force:
// the everyday direction is sync-csv-from-workbook.ts, not this one
import fs from "node:fs";
import ExcelJS from "exceljs";
import { buildBalanceTables } from "./balance-tables.ts";
import { WORKBOOK_PATH } from "./game-data-paths.ts";
import { writeCsvTables } from "./write-csv-tables.ts";

const HEADER_ROW_HEIGHT = 1;

async function extractGameData() {
  const isForced = process.argv.includes("--force");

  if (fs.existsSync(WORKBOOK_PATH) && !isForced) {
    console.error(`refusing to overwrite ${WORKBOOK_PATH}`);
    console.error("re-run with --force to rebuild it from the code, losing any edits it holds");
    process.exitCode = 1;
    return;
  }

  const tables = buildBalanceTables();
  const workbook = new ExcelJS.Workbook();

  for (const table of tables) {
    const worksheet = workbook.addWorksheet(table.name);
    worksheet.columns = table.columns.map((column) => ({
      header: column,
      key: column,
      width: Math.max(column.length + 2, 10),
    }));
    worksheet.addRows(table.rows);
    worksheet.getRow(1).font = { bold: true };
    worksheet.views = [{ state: "frozen", ySplit: HEADER_ROW_HEIGHT }];
  }

  await workbook.xlsx.writeFile(WORKBOOK_PATH);
  console.log(`wrote ${WORKBOOK_PATH}`);

  console.log("wrote csvs:");
  writeCsvTables(tables);
}

await extractGameData();
