import { CombatAttribute, NormalizedPercentage, isNumericEnumMember } from "@speed-dungeon/common";
import { AnalysisSlice } from "../analysis-runs/analysis-slice.ts";
import { CharacterBuildSpecification } from "../analysis-subjects/analysis-character-specification.ts";
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
  /** by slug rather than by the StudyName ordinal, which moves whenever a study is added anywhere
   * but the end of the enum */
  panelsByStudy: Record<string, PersistedStudyPanelState>;
}

/** no level: nothing selects it, so it stays whatever COMBATANT_MAX_LEVEL is now */
export interface PersistedAttainableAttributesTabState {
  attribute: CombatAttribute;
  buildSpec: CharacterBuildSpecification;
}

export interface PersistedUiState {
  tab: BalanceToolsTab;
  studies: PersistedStudiesTabState;
  attainableAttributes: PersistedAttainableAttributesTabState;
}

/** whatever the last version of the app wrote, so every value is checked before it is used and a
 * selection that no longer parses leaves its default standing */
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

/** clamped rather than dropped, so a bound that moved in code leaves the nearest selection
 * standing instead of the default */
export function readStoredNumberInRange(stored: unknown, min: number, max: number) {
  const value = readStoredNumber(stored);

  return value === undefined ? undefined : Math.min(Math.max(value, min), max);
}

/** renumbering is not caught and cannot be: the stored number is still a member, just a different
 * one, which is why anything keyed by a study is keyed by its slug instead */
export function isStoredEnumMember<TMember extends number>(
  enumObject: Record<number, string>,
  stored: unknown
): stored is TMember {
  return typeof stored === "number" && isNumericEnumMember(enumObject, stored);
}
