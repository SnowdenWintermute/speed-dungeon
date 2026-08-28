import {
  CombatAttribute,
  EquipmentRequirementEntry,
  EquipmentType,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import {
  BASE_ITEM_IMPORT_CANDIDATES,
  getBaseItemReference,
} from "@/workbook/base-item-reference";
import { emitImportList, selectUsedImports } from "@/workbook/emitted-imports";
import { STUDY_NAME_SLUGS, StudyName } from "./study-name";

// no node imports: the browser renders the text and the dev server only writes it

const GENERATED_MODULE_DIRECTORY = "packages/common/src/items/item-creation/equipment-templates";

/**
 * Shorthand, so the compiler checks each name against a real binding rather than a string that would
 * go on looking right after a rename. Checked against common's barrel; the generated file imports
 * the same bindings re-exported by game-data-dependencies.
 */
const IMPORT_CANDIDATES = {
  ...BASE_ITEM_IMPORT_CANDIDATES,
  CombatAttribute,
  EquipmentType,
};

/** one module per study, wholly owned by it, so no generate ever has to merge with another's output */
export function generatedRequirementsModulePath(studyName: StudyName) {
  return `${GENERATED_MODULE_DIRECTORY}/requirements-from-${STUDY_NAME_SLUGS[studyName]}.generated.ts`;
}

export function generatedRequirementsConstName(studyName: StudyName) {
  return `EQUIPMENT_REQUIREMENTS_FROM_${STUDY_NAME_SLUGS[studyName].toUpperCase().replaceAll("-", "_")}`;
}

function emitRequirements(requirements: EquipmentRequirementEntry["requirements"]) {
  const entries = iterateNumericEnumKeyedRecord(requirements).map(
    ([attribute, value]) => `[CombatAttribute.${CombatAttribute[attribute]}]: ${value}`
  );
  return entries.length === 0 ? "{}" : `{ ${entries.join(", ")} }`;
}

function emitEntry(entry: EquipmentRequirementEntry) {
  return `  {
    baseItem: {
      equipmentType: EquipmentType.${EquipmentType[entry.baseItem.equipmentType]},
      baseItemType: ${getBaseItemReference(entry.baseItem)},
    },
    requirements: ${emitRequirements(entry.requirements)},
  }`;
}

export function emitEquipmentRequirementsModule(
  studyName: StudyName,
  entries: EquipmentRequirementEntry[]
) {
  const body = `
export const ${generatedRequirementsConstName(studyName)}: EquipmentRequirementEntry[] = [
${entries.map(emitEntry).join(",\n")}${entries.length === 0 ? "" : ","}
];
`;

  const header = `// GENERATED FILE — do not edit by hand.
// Source: the ${STUDY_NAME_SLUGS[studyName]} study in packages/balance-tools
// Regenerate by running that study and pressing "generate equipment requirements".
${emitImportList(selectUsedImports(IMPORT_CANDIDATES, body), "./game-data-dependencies.js")}import type { EquipmentRequirementEntry } from "./game-data-dependencies.js";
`;

  return `${header}${body}`;
}
