import fs from "node:fs";
import path from "node:path";
import { CombatAttribute, CombatantClass, EquipmentType } from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty.ts";
import type { EquipmentRequirementTarget } from "../studies/requirement-target.ts";
import { StudyName } from "../studies/study-name.ts";
import type { AnalysisSlice } from "../analysis-runs/analysis-slice.ts";
import { BASE_ITEM_IMPORT_CANDIDATES, getBaseItemReference } from "./base-item-reference.ts";
import { emitImportList, selectUsedImports } from "./emitted-imports.ts";
import { PACKAGE_ROOT } from "./game-data-paths.ts";

export const GENERATED_REQUIREMENT_TARGETS_PATH = path.join(
  PACKAGE_ROOT,
  "src",
  "studies",
  "requirement-targets.generated.ts"
);

/** shorthand, so the compiler checks each name against the binding the generated file will import */
const COMMON_IMPORT_CANDIDATES = {
  ...BASE_ITEM_IMPORT_CANDIDATES,
  CombatAttribute,
  CombatantClass,
  EquipmentType,
};

function emitHeader(body: string) {
  const fromCommon = selectUsedImports(COMMON_IMPORT_CANDIDATES, body);
  const specialtyImport =
    selectUsedImports({ CharacterWeaponSpecialty }, body).length > 0
      ? `import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty.ts";\n`
      : "";

  return `// GENERATED FILE — do not edit by hand.
// Source: packages/balance-tools/game-data.xlsx
// Regenerate with: yarn workspace @speed-dungeon/balance-tools sync
${emitImportList(fromCommon, "@speed-dungeon/common")}${specialtyImport}import type { EquipmentRequirementTarget } from "./requirement-target.ts";
import { StudyName } from "./study-name.ts";
`;
}

function emitBuildSlice(slice: AnalysisSlice) {
  const fields: string[] = [];

  if (slice.weaponSpecialty !== undefined) {
    fields.push(
      `weaponSpecialty: CharacterWeaponSpecialty.${CharacterWeaponSpecialty[slice.weaponSpecialty]}`
    );
  }
  if (slice.mainClass !== undefined) {
    fields.push(`mainClass: CombatantClass.${CombatantClass[slice.mainClass]}`);
  }
  if (slice.supportClass !== undefined) {
    fields.push(
      `supportClass: ${
        slice.supportClass === null ? "null" : `CombatantClass.${CombatantClass[slice.supportClass]}`
      }`
    );
  }

  return fields.length === 0 ? "{}" : `{ ${fields.join(", ")} }`;
}

function emitAttributes(attributes: CombatAttribute[]) {
  return `[${attributes
    .map((attribute) => `CombatAttribute.${CombatAttribute[attribute]}`)
    .join(", ")}]`;
}

function emitTarget(target: EquipmentRequirementTarget) {
  return `  {
    baseItem: {
      equipmentType: EquipmentType.${EquipmentType[target.baseItem.equipmentType]},
      baseItemType: ${getBaseItemReference(target.baseItem)},
    },
    studyName: StudyName.${StudyName[target.studyName]},
    attributes: ${emitAttributes(target.attributes)},
    buildSlice: ${emitBuildSlice(target.buildSlice)},
    availabilityPercentile: ${target.availabilityPercentile},
  }`;
}

export function emitRequirementTargetsModule(targets: EquipmentRequirementTarget[]) {
  const entries = targets.map(emitTarget).join(",\n");
  const body = `
export const EQUIPMENT_REQUIREMENT_TARGETS: EquipmentRequirementTarget[] = [
${entries}${targets.length === 0 ? "" : ","}
];
`;
  fs.writeFileSync(GENERATED_REQUIREMENT_TARGETS_PATH, `${emitHeader(body)}${body}`);
  return GENERATED_REQUIREMENT_TARGETS_PATH;
}
