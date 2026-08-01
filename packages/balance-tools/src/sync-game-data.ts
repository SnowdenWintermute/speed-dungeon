import { assembleEquipmentSpecs } from "./assemble-equipment-specs.ts";
import { emitGameDataModule } from "./emit-game-data-module.ts";
import { NOT_YET_CONSUMED_SHEETS } from "./sheet-schemas.ts";
import { openWorkbook } from "./workbook-reader.ts";

async function syncGameData() {
  const workbook = await openWorkbook();
  const specs = assembleEquipmentSpecs(workbook);
  const modulePath = emitGameDataModule(specs);

  console.log(`wrote ${specs.length} equipment templates to ${modulePath}`);
  console.log(`not yet consumed by the game: ${NOT_YET_CONSUMED_SHEETS.join(", ")}`);
}

await syncGameData();
