import { NormalizedPercentage, isNumericEnumMember } from "@speed-dungeon/common";
import { AnalysisSlice } from "../analysis-runs/analysis-slice.ts";
import { AttainableAttributeSpecification } from "../attribute-viewer/attainable-attribute-calculator.ts";
import { StudyName } from "../studies/study-name.ts";
import { BalanceToolsTab } from "../tabs.ts";

const STORAGE_KEY = "balanceToolsUiState";

export interface PersistedStudyPanelState {
  runCountText: string;
  chosenAllocationIntensity: NormalizedPercentage;
  chosenHonorsEquipmentRequirements: boolean;
  chosenTargetDummiesHaveArmorClass: boolean;
  slice: AnalysisSlice;
}

export interface PersistedStudiesTabState {
  studyName: StudyName;
  panelsByStudy: Partial<Record<StudyName, PersistedStudyPanelState>>;
}

export interface PersistedAttainableAttributesTabState {
  specification: AttainableAttributeSpecification;
}

export interface PersistedUiState {
  tab: BalanceToolsTab;
  studies: PersistedStudiesTabState;
  attainableAttributes: PersistedAttainableAttributesTabState;
}

/** anything stored is whatever the last version of the app wrote, so it is read as unknown and
 * every value checked; a selection that no longer parses leaves its default standing */
export function readPersistedUiState(): unknown {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? undefined : JSON.parse(stored);
  } catch {
    return undefined;
  }
}

export function writePersistedUiState(state: PersistedUiState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // a full or unavailable store costs the next reload its selections, which is not worth
    // interrupting the run in front of the user for
  }
}

export function isStoredRecord(stored: unknown): stored is Record<string, unknown> {
  return stored !== null && typeof stored === "object";
}

export function readStoredString(stored: unknown) {
  return typeof stored === "string" ? stored : undefined;
}

export function readStoredBoolean(stored: unknown) {
  return typeof stored === "boolean" ? stored : undefined;
}

export function readStoredNumber(stored: unknown) {
  return typeof stored === "number" && Number.isFinite(stored) ? stored : undefined;
}

/** a numeric enum whose member was dropped or renumbered since the value was stored reads as
 * absent rather than as a member the app has no case for */
export function isStoredEnumMember<TMember extends number>(
  enumObject: Record<number, string>,
  stored: unknown
): stored is TMember {
  return typeof stored === "number" && isNumericEnumMember(enumObject, stored);
}
