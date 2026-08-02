import { assembleAttributeTables } from "./assemble-attribute-tables.ts";
import { assembleEquipmentSpecs } from "./assemble-equipment-specs.ts";
import { emitAttributeTablesModule } from "./emit-attribute-tables-module.ts";
import { emitGameDataModule } from "./emit-game-data-module.ts";
import { openWorkbook } from "./workbook-reader.ts";

async function syncGameData() {
  const workbook = await openWorkbook();

  const specs = assembleEquipmentSpecs(workbook);
  const equipmentModulePath = emitGameDataModule(specs);
  console.log(`wrote ${specs.length} equipment templates to ${equipmentModulePath}`);

  const tables = assembleAttributeTables(workbook);
  const attributeTablesPath = emitAttributeTablesModule(tables);
  const tableNames = tables.map((table) => table.schema.constName).join(", ");
  console.log(`wrote ${tableNames} to ${attributeTablesPath}`);
}

await syncGameData();
