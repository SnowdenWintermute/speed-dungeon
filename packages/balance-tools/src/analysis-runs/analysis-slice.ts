import { CombatantClass } from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty.ts";

/**
 * An omitted dimension means "any", so dropping one widens the slice without a re-run. Kept apart
 * from analysis-sample.ts so the workbook sync can name a slice without reaching that module's
 * @/-aliased imports, which node does not resolve.
 */
export interface AnalysisSlice {
  weaponSpecialty?: CharacterWeaponSpecialty;
  mainClass?: CombatantClass;
  supportClass?: CombatantClass | null;
}
