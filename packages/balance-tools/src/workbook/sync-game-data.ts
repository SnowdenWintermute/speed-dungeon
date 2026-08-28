import { assembleAttributeTables } from "./assemble-attribute-tables.ts";
import { assembleEquipmentSpecs } from "./assemble-equipment-specs.ts";
import { assembleRequirementTargets } from "./assemble-requirement-targets.ts";
import { emitAttributeTablesModule } from "./emit-attribute-tables-module.ts";
import { emitGameDataModule } from "./emit-game-data-module.ts";
import { emitRequirementTargetsModule } from "./emit-requirement-targets-module.ts";
import { REQUIREMENT_TARGETS_SHEET } from "./sheet-schemas.ts";
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

  // the sheet is hand authored and may not exist yet. a missing one is skipped rather than fatal, so
  // adding requirement derivation does not stop the rest of the sync from working; a malformed one
  // still throws
  if (workbook.getWorksheet(REQUIREMENT_TARGETS_SHEET.name) === undefined) {
    console.log(
      `no "${REQUIREMENT_TARGETS_SHEET.name}" sheet — add it to start deriving equipment requirements`
    );
    return;
  }

  const targets = assembleRequirementTargets(workbook);
  const targetsPath = emitRequirementTargetsModule(targets);
  console.log(`wrote ${targets.length} equipment requirement targets to ${targetsPath}`);
}

await syncGameData();
