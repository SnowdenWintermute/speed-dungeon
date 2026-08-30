import { CombatantClass } from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty.ts";
import { AnalysisGoal } from "../goal-performance-checkers/analysis-goal.ts";

/** an omitted dimension means "any", so dropping one widens the slice without a re-run */
export interface AnalysisSlice {
  weaponSpecialty?: CharacterWeaponSpecialty;
  mainClass?: CombatantClass;
  supportClass?: CombatantClass | null;
  goal?: AnalysisGoal;
}

/**
 * Named dimensions rather than a stringified object, so a key cannot turn on property order, and
 * `String` rather than a bare join, since a support class of null means having none at all while
 * undefined means any — the two join to the same empty text.
 */
export function sliceKey(slice: AnalysisSlice) {
  return [slice.weaponSpecialty, slice.mainClass, slice.supportClass, slice.goal]
    .map(String)
    .join("-");
}
