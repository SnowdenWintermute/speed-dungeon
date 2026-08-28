import ExcelJS from "exceljs";
import { CombatAttribute, invariant, iterateNumericEnum } from "@speed-dungeon/common";
import type { CombatantAttributeRecord } from "@speed-dungeon/common";
import { ATTRIBUTE_TABLE_SCHEMAS, getAttributeSheetColumns } from "./sheet-schemas.ts";
import type { AttributeTableSchema } from "./sheet-schemas.ts";
import { readSheet } from "./workbook-reader.ts";
import type { SheetRow } from "./workbook-reader.ts";

export interface AttributeTable {
  schema: AttributeTableSchema;
  recordsByKey: Map<number, CombatantAttributeRecord>;
}

export function assembleAttributeTables(workbook: ExcelJS.Workbook): AttributeTable[] {
  return ATTRIBUTE_TABLE_SCHEMAS.map((schema) => assembleAttributeTable(workbook, schema));
}

function assembleAttributeTable(
  workbook: ExcelJS.Workbook,
  schema: AttributeTableSchema
): AttributeTable {
  const recordsByKey = new Map<number, CombatantAttributeRecord>();

  for (const row of readSheet(workbook, schema.sheetName, getAttributeSheetColumns(schema))) {
    const name = row.getText(schema.keyColumn);
    const key = row.getEnumMember(schema.keyColumn, schema.keysByName);
    invariant(!recordsByKey.has(key), `${row.describe()}: "${name}" appears on more than one row`);
    recordsByKey.set(key, readAttributes(row));
  }

  assertEveryKeyCovered(schema, recordsByKey);
  return { schema, recordsByKey };
}

function readAttributes(row: SheetRow): CombatantAttributeRecord {
  const record: CombatantAttributeRecord = {};
  for (const attribute of iterateNumericEnum(CombatAttribute)) {
    const value = row.getNumberOption(CombatAttribute[attribute]);
    if (value !== null) {
      record[attribute] = value;
    }
  }
  return record;
}

function assertEveryKeyCovered(
  schema: AttributeTableSchema,
  recordsByKey: Map<number, CombatantAttributeRecord>
) {
  const missing = [...schema.keysByName.entries()]
    .filter(([, key]) => !recordsByKey.has(key))
    .map(([name]) => name);
  invariant(
    missing.length === 0,
    `${schema.sheetName} has no row for: ${missing.join(", ")}`
  );
}
