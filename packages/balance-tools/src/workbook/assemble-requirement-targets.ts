import ExcelJS from "exceljs";
import { CombatAttribute, invariant } from "@speed-dungeon/common";
import type { EquipmentBaseItem } from "@speed-dungeon/common";
import { DERIVABLE_REQUIREMENT_ATTRIBUTES } from "../studies/derivable-requirement-attributes.ts";
import type { EquipmentRequirementTarget } from "../studies/requirement-target.ts";
import { STUDY_ANALYSES, STUDY_NAME_SLUGS } from "../studies/study-name.ts";
import type { StudyName } from "../studies/study-name.ts";
import type { AnalysisSlice } from "../analysis-runs/analysis-slice.ts";
import { STUDY_CONFIGURATIONS } from "../studies/study-configurations.ts";
import { AnalysisGoal } from "../goal-performance-checkers/analysis-goal.ts";
import {
  ANALYSIS_GOALS_BY_NAME,
  CHARACTER_WEAPON_SPECIALTIES_BY_NAME,
  COMBATANT_CLASSES_BY_NAME,
  COMBAT_ATTRIBUTES_BY_NAME,
  EQUIPMENT_TYPES_BY_NAME,
  STUDY_NAMES_BY_NAME,
  parseBaseItem,
} from "./enum-lookups.ts";
import { NO_SUPPORT_CLASS, REQUIREMENT_TARGETS_SHEET } from "./sheet-schemas.ts";
import { SheetRow, readSheet } from "./workbook-reader.ts";

const ATTRIBUTE_SEPARATOR = ",";

export function assembleRequirementTargets(
  workbook: ExcelJS.Workbook
): EquipmentRequirementTarget[] {
  const targets: EquipmentRequirementTarget[] = [];
  const claimedBy = new Map<string, string>();

  for (const row of readSheet(
    workbook,
    REQUIREMENT_TARGETS_SHEET.name,
    REQUIREMENT_TARGETS_SHEET.columns
  )) {
    // the sheet is a roster of every base item, so most rows name no study and are not targets yet
    const studyNameOption = row.getEnumMemberOption(
      REQUIREMENT_TARGETS_SHEET.studyColumn,
      STUDY_NAMES_BY_NAME
    );
    if (studyNameOption === null) {
      assertNothingElseIsFilledIn(row);
      continue;
    }

    const equipmentType = row.getEnumMember("equipmentType", EQUIPMENT_TYPES_BY_NAME);
    const baseItem = parseBaseItem(equipmentType, row);
    const attributes = readAttributes(row, studyNameOption);

    assertAttributesNotAlreadyClaimed(claimedBy, baseItem, attributes, row);

    targets.push({
      baseItem,
      studyName: studyNameOption,
      attributes,
      buildSlice: readBuildSlice(row, studyNameOption),
      availabilityPercentile: readAvailabilityPercentile(row),
    });
  }

  return targets;
}

/**
 * A row is a target once it names a study. Filling anything else in without one would otherwise be
 * skipped in silence, which looks exactly like the target not working.
 */
function assertNothingElseIsFilledIn(row: SheetRow) {
  for (const column of REQUIREMENT_TARGETS_SHEET.targetColumns) {
    invariant(
      row.getTextOption(column) === null,
      `${row.describe(column)} is filled in but the row names no study, so it derives nothing`
    );
  }
}

/**
 * Two studies setting the same requirement on the same item would both be right and disagree, and
 * whichever generated last would win silently. Caught here rather than at boot so the message can
 * name the row you would have to go and fix.
 */
function assertAttributesNotAlreadyClaimed(
  claimedBy: Map<string, string>,
  baseItem: EquipmentBaseItem,
  attributes: CombatAttribute[],
  row: SheetRow
) {
  for (const attribute of attributes) {
    const claim = `${baseItem.equipmentType}-${baseItem.baseItemType}-${attribute}`;
    const existing = claimedBy.get(claim);
    invariant(
      existing === undefined,
      `${row.describe()}: ${CombatAttribute[attribute]} for this base item is already derived by ${existing}`
    );
    claimedBy.set(claim, row.describe());
  }
}

function readAttributes(row: SheetRow, studyName: StudyName) {
  const derivable = DERIVABLE_REQUIREMENT_ATTRIBUTES[STUDY_ANALYSES[studyName]];

  const attributes = row
    .getText("attributes")
    .split(ATTRIBUTE_SEPARATOR)
    .map((name) => name.trim())
    .filter((name) => name !== "")
    .map((name) => {
      const attribute = COMBAT_ATTRIBUTES_BY_NAME.get(name);
      invariant(
        attribute !== undefined,
        `${row.describe("attributes")}: "${name}" is not a combat attribute`
      );
      return attribute;
    });

  invariant(attributes.length > 0, `${row.describe("attributes")} names no attributes`);

  for (const attribute of attributes) {
    invariant(
      derivable.includes(attribute),
      `${row.describe("attributes")}: ${STUDY_NAME_SLUGS[studyName]} does not measure ` +
        `${CombatAttribute[attribute]}, so a requirement read from it would be meaningless. ` +
        `it can derive: ${derivable.map((each) => CombatAttribute[each]).join(", ")}`
    );
  }

  return attributes;
}

/**
 * A goal naming nothing in the study's party would quietly match no samples, and the anchor row
 * lookup would then blame the room for having no data rather than blaming the typo.
 */
function assertGoalIsInStudysParty(row: SheetRow, studyName: StudyName, goal: AnalysisGoal) {
  const goalsInParty = STUDY_CONFIGURATIONS[studyName].characterSpecs.map((spec) => spec.goal);

  invariant(
    goalsInParty.includes(goal),
    `${row.describe("goal")}: ${STUDY_NAME_SLUGS[studyName]} seats no character chasing ` +
      `${AnalysisGoal[goal]}. its party chases: ` +
      [...new Set(goalsInParty)].map((each) => AnalysisGoal[each]).join(", ")
  );
}

/** a blank cell means "any", the same way an omitted dimension does when slicing a table */
function readBuildSlice(row: SheetRow, studyName: StudyName): AnalysisSlice {
  const slice: AnalysisSlice = {};

  const goal = row.getEnumMemberOption("goal", ANALYSIS_GOALS_BY_NAME);
  if (goal !== null) {
    assertGoalIsInStudysParty(row, studyName, goal);
    slice.goal = goal;
  }

  const weaponSpecialty = row.getEnumMemberOption(
    "weaponSpecialty",
    CHARACTER_WEAPON_SPECIALTIES_BY_NAME
  );
  if (weaponSpecialty !== null) {
    slice.weaponSpecialty = weaponSpecialty;
  }

  const mainClass = row.getEnumMemberOption("mainClass", COMBATANT_CLASSES_BY_NAME);
  if (mainClass !== null) {
    slice.mainClass = mainClass;
  }

  // three states here rather than two: blank is any support class, "none" is having none at all
  const supportClassText = row.getTextOption("supportClass");
  if (supportClassText === NO_SUPPORT_CLASS) {
    slice.supportClass = null;
  } else if (supportClassText !== null) {
    slice.supportClass = row.getEnumMember("supportClass", COMBATANT_CLASSES_BY_NAME);
  }

  return slice;
}

function readAvailabilityPercentile(row: SheetRow) {
  const percentile = row.getNumber("availabilityPercentile");
  invariant(
    percentile >= 0 && percentile <= 1,
    `${row.describe("availabilityPercentile")} is ${percentile}, which is not between 0 and 1`
  );
  return percentile;
}
