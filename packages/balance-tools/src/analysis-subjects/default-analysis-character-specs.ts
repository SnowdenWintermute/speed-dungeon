import { CombatantClass } from "@speed-dungeon/common";
import { AnalysisCharacterSpecification } from "./analysis-character-specification.ts";
import type { CharacterBuildSpecification } from "./analysis-character-specification.ts";
import { CharacterWeaponSpecialty } from "./character-weapon-specialty.ts";
import { AnalysisGoal } from "../goal-performance-checkers/analysis-goal.ts";

export interface NamedAnalysisCharacterBuild {
  name: string;
  build: CharacterBuildSpecification;
}

/** the builds every study walks with, so their tables are read against the same characters */
export const DEFAULT_ANALYSIS_CHARACTER_BUILDS: NamedAnalysisCharacterBuild[] = [
  {
    name: "character 1",
    build: {
      mainClass: CombatantClass.Warrior,
      supportClass: CombatantClass.Rogue,
      weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee,
    },
  },
  {
    name: "character 2",
    build: {
      mainClass: CombatantClass.Rogue,
      supportClass: CombatantClass.Warrior,
      weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged,
    },
  },
  {
    name: "character 3",
    build: {
      mainClass: CombatantClass.Mage,
      supportClass: CombatantClass.Rogue,
      weaponSpecialty: CharacterWeaponSpecialty.Shields,
    },
  },
];

/** the whole default party chasing one goal, which is what a single goal study walks with */
export function defaultAnalysisCharacterSpecs(goal: AnalysisGoal) {
  return DEFAULT_ANALYSIS_CHARACTER_BUILDS.map(
    ({ name, build }) => new AnalysisCharacterSpecification(name, build, goal)
  );
}
