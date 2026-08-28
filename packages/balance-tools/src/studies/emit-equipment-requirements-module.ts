import {
  CombatAttribute,
  EquipmentRequirementEntry,
  EquipmentType,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import {
  DERIVED_REQUIREMENTS_DIRECTORY,
  derivedRequirementsFileName,
} from "@/generated-file-contract";
import { emitGeneratedModuleHeader, selectUsedImports } from "@/generated-module-header";
import {
  BASE_ITEM_IMPORT_CANDIDATES,
  getBaseItemReference,
} from "@/workbook/base-item-reference";
import { STUDY_NAME_SLUGS, StudyName } from "./study-name";

// no node imports: the browser renders the text and the dev server only writes it

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
  const fileName = derivedRequirementsFileName(STUDY_NAME_SLUGS[studyName]);
  return `${DERIVED_REQUIREMENTS_DIRECTORY}/${fileName}`;
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

  const header = emitGeneratedModuleHeader({
    source: `the ${STUDY_NAME_SLUGS[studyName]} study in packages/balance-tools`,
    regenerate: `run that study and press "generate equipment requirements"`,
    imports: [
      {
        from: "./game-data-dependencies.js",
        names: selectUsedImports(IMPORT_CANDIDATES, body),
        typeNames: ["EquipmentRequirementEntry"],
      },
    ],
  });

  return `${header}${body}`;
}
