import { CombatantClass } from "@speed-dungeon/common";
import { AnalysisCharacterSpecification } from "./analysis-character-specification";
import { CharacterWeaponSpecialty } from "./character-weapon-specialty";

/** the party every study walks with, so their tables are read against the same builds */
export const DEFAULT_ANALYSIS_CHARACTER_SPECS = [
  new AnalysisCharacterSpecification("character 1", {
    mainClass: CombatantClass.Warrior,
    supportClass: CombatantClass.Rogue,
    weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee,
  }),
  new AnalysisCharacterSpecification("character 2", {
    mainClass: CombatantClass.Rogue,
    supportClass: CombatantClass.Warrior,
    weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged,
  }),
  new AnalysisCharacterSpecification("character 3", {
    mainClass: CombatantClass.Mage,
    supportClass: CombatantClass.Rogue,
    weaponSpecialty: CharacterWeaponSpecialty.Shields,
  }),
];
