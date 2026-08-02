import fs from "node:fs";
import path from "node:path";
import { CombatAttribute, invariant, iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import type { CombatantAttributeRecord } from "@speed-dungeon/common";
import type { AttributeTable } from "./assemble-attribute-tables.ts";
import { PACKAGE_ROOT } from "./game-data-paths.ts";

export const GENERATED_ATTRIBUTE_TABLES_PATH = path.join(
  PACKAGE_ROOT,
  "..",
  "common",
  "src",
  "combatants",
  "attributes",
  "attribute-tables.generated.ts"
);

function emitHeader(tables: AttributeTable[]) {
  const keyTypeNames = [...new Set(tables.map((table) => table.schema.keyTypeName))].sort();

  return `// GENERATED FILE — do not edit by hand.
// Source: packages/balance-tools/game-data.xlsx
// Regenerate with: yarn workspace @speed-dungeon/balance-tools sync
import {
  CombatAttribute,
${keyTypeNames.map((name) => `  ${name},`).join("\n")}
} from "./attribute-table-dependencies.js";
import type { CombatantAttributeRecord } from "./attribute-table-dependencies.js";
`;
}

function emitAttributeRecord(record: CombatantAttributeRecord) {
  const entries = iterateNumericEnumKeyedRecord(record).map(
    ([attribute, value]) => `    [CombatAttribute.${CombatAttribute[attribute]}]: ${value},`
  );
  return entries.length === 0 ? "{}" : `{\n${entries.join("\n")}\n  }`;
}

function emitTable(table: AttributeTable) {
  const { schema } = table;
  const entries = [...schema.keysByName.entries()].map(([name, key]) => {
    const record = table.recordsByKey.get(key);
    invariant(record !== undefined, `${schema.sheetName} has no row for ${name}`);
    return `  [${schema.keyTypeName}.${name}]: ${emitAttributeRecord(record)},`;
  });

  return `
export const ${schema.constName}: Record<${schema.keyTypeName}, CombatantAttributeRecord> = {
${entries.join("\n")}
};
`;
}

export function emitAttributeTablesModule(tables: AttributeTable[]) {
  const body = tables.map(emitTable).join("");
  fs.writeFileSync(GENERATED_ATTRIBUTE_TABLES_PATH, `${emitHeader(tables)}${body}`);
  return GENERATED_ATTRIBUTE_TABLES_PATH;
}
