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
