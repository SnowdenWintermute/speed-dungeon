import fs from "node:fs";
import ExcelJS from "exceljs";
import { invariant } from "@speed-dungeon/common";
import { WORKBOOK_PATH } from "./game-data-paths.ts";

export class SheetRow {
  constructor(
    private cells: Map<string, string>,
    private sheetName: string,
    private rowNumber: number
  ) {}

  describe(column?: string) {
    const columnPart = column === undefined ? "" : `, column "${column}"`;
    return `${this.sheetName} row ${this.rowNumber}${columnPart}`;
  }

  getTextOption(column: string): null | string {
    const cell = this.cells.get(column);
    invariant(cell !== undefined, `${this.describe(column)} does not exist`);
    return cell === "" ? null : cell;
  }

  getText(column: string): string {
    const text = this.getTextOption(column);
    invariant(text !== null, `${this.describe(column)} is empty`);
    return text;
  }

  getNumberOption(column: string): null | number {
    const text = this.getTextOption(column);
    if (text === null) {
      return null;
    }
    const value = Number(text);
    invariant(!isNaN(value), `${this.describe(column)} is "${text}", which is not a number`);
    return value;
  }

  getNumber(column: string): number {
    const value = this.getNumberOption(column);
    invariant(value !== null, `${this.describe(column)} is empty`);
    return value;
  }

  getEnumMemberOption<T extends number>(column: string, byName: Map<string, T>): null | T {
    const name = this.getTextOption(column);
    if (name === null) {
      return null;
    }
    const value = byName.get(name);
    invariant(
      value !== undefined,
      `${this.describe(column)} is "${name}", which is not one of: ${[...byName.keys()].join(", ")}`
    );
    return value;
  }

  getEnumMember<T extends number>(column: string, byName: Map<string, T>): T {
    const value = this.getEnumMemberOption(column, byName);
    invariant(value !== null, `${this.describe(column)} is empty`);
    return value;
  }
}

/** a numeric enum object holds both directions; the string-keyed half is the name to value lookup */
export function assembleEnumMemberLookup<T extends Record<string, string | number>>(
  enumObject: T
): Map<string, T[keyof T]> {
  return new Map(
    Object.entries(enumObject).filter(
      (entry): entry is [string, T[keyof T]] => typeof entry[1] === "number"
    )
  );
}

export async function openWorkbook() {
  invariant(
    fs.existsSync(WORKBOOK_PATH),
    `no workbook at ${WORKBOOK_PATH} — it is the source of truth for game data`
  );
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(WORKBOOK_PATH);
  return workbook;
}

/** a formula cell carries both the formula and its last computed result; the result is the value the
 * game should see, which is what lets a sheet derive one column from another */
function readCellText(cell: ExcelJS.Cell, describeCell: () => string): string {
  const { value } = cell;

  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "number" || typeof value === "string") {
    return `${value}`.trim();
  }
  if (typeof value === "object" && "result" in value) {
    const { result } = value;
    invariant(
      result !== undefined,
      `${describeCell()} holds an uncalculated formula — open the workbook, let it recalculate, ` +
        `and save`
    );
    invariant(
      typeof result === "number" || typeof result === "string",
      `${describeCell()} formula produced ${JSON.stringify(result)}`
    );
    return `${result}`.trim();
  }

  throw new Error(`${describeCell()} holds an unsupported value type`);
}

export function readSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  expectedColumns: string[]
): SheetRow[] {
  const worksheet = workbook.getWorksheet(sheetName);
  invariant(worksheet !== undefined, `the workbook has no "${sheetName}" sheet`);

  const headerRow = worksheet.getRow(1);
  const columnNumbersByName = new Map<string, number>();
  headerRow.eachCell((cell, columnNumber) => {
    const header = readCellText(cell, () => `${sheetName}!${cell.address}`);
    if (header !== "") {
      columnNumbersByName.set(header, columnNumber);
    }
  });

  for (const column of expectedColumns) {
    invariant(
      columnNumbersByName.has(column),
      `${sheetName} is missing column "${column}" — it has: ` +
        `${[...columnNumbersByName.keys()].join(", ")}`
    );
  }

  const rows: SheetRow[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }
    const cells = new Map<string, string>();
    let hasValue = false;
    for (const [column, columnNumber] of columnNumbersByName) {
      const cell = row.getCell(columnNumber);
      const text = readCellText(cell, () => `${sheetName}!${cell.address}`);
      cells.set(column, text);
      if (text !== "") {
        hasValue = true;
      }
    }
    if (hasValue) {
      rows.push(new SheetRow(cells, sheetName, rowNumber));
    }
  });

  return rows;
}
