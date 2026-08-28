import fs from "node:fs";
import path from "node:path";
import { CombatAttribute, invariant, iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import type { CombatantAttributeRecord } from "@speed-dungeon/common";
import { emitGeneratedModuleHeader } from "../generated-module-header.ts";
import type { AttributeTable } from "./assemble-attribute-tables.ts";
import { PACKAGE_ROOT, WORKBOOK_SOURCE, WORKBOOK_SYNC_COMMAND } from "./game-data-paths.ts";

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
  const keyTypeNames = tables.map((table) => table.schema.keyTypeName);

  return emitGeneratedModuleHeader({
    source: WORKBOOK_SOURCE,
    regenerate: WORKBOOK_SYNC_COMMAND,
    imports: [
      {
        from: "./attribute-table-dependencies.js",
        names: [...new Set(["CombatAttribute", ...keyTypeNames])].sort(),
        typeNames: ["CombatantAttributeRecord"],
      },
    ],
  });
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
