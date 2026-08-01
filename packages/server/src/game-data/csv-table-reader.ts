import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { invariant } from "@speed-dungeon/common";

const GAME_DATA_DIRECTORY = path.join(import.meta.dirname, "..", "..", "game-data");

export class CsvRow {
  constructor(
    private cells: Record<string, string>,
    private tableName: string,
    private rowNumber: number
  ) {}

  private describe(column: string) {
    return `${this.tableName}.csv row ${this.rowNumber}, column "${column}"`;
  }

  getTextOption(column: string): null | string {
    const cell = this.cells[column];
    invariant(cell !== undefined, `${this.describe(column)} does not exist`);
    const trimmed = cell.trim();
    return trimmed === "" ? null : trimmed;
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

  /** enum members travel as their code names so a renamed display string can't silently repoint a
   * row at a different member */
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

export function assembleEnumMemberLookup<T extends number>(
  values: T[],
  getName: (value: T) => string
) {
  return new Map(values.map((value) => [getName(value), value]));
}

/** the expected columns come from the code, so a sheet that has drifted fails here rather than
 * yielding rows full of undefined */
export function readCsvTable(tableName: string, expectedColumns: string[]): CsvRow[] {
  const filePath = path.join(GAME_DATA_DIRECTORY, `${tableName}.csv`);
  invariant(fs.existsSync(filePath), `no game data file at ${filePath}`);

  // a sheet exported from a spreadsheet editor carries a byte order mark and crlf endings
  const contents = fs.readFileSync(filePath, "utf8");
  const parsed = Papa.parse<Record<string, string>>(contents, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  invariant(
    parsed.errors.length === 0,
    `${tableName}.csv could not be parsed: ${parsed.errors.map((e) => e.message).join("; ")}`
  );

  const actualColumns = parsed.meta.fields ?? [];
  for (const column of expectedColumns) {
    invariant(
      actualColumns.includes(column),
      `${tableName}.csv is missing column "${column}" — it has: ${actualColumns.join(", ")}`
    );
  }

  // the header is row 1, so the first data row reads as row 2 the way it does in the editor
  return parsed.data.map((cells, index) => new CsvRow(cells, tableName, index + 2));
}
