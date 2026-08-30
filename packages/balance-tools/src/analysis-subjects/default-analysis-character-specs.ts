import { CombatantClass } from "@speed-dungeon/common";
import { AnalysisCharacterSpecification } from "./analysis-character-specification.ts";
import type { CharacterBuildSpecification } from "./analysis-character-specification.ts";
import { CharacterWeaponSpecialty } from "./character-weapon-specialty.ts";
import { AnalysisGoal } from "../goal-performance-checkers/analysis-goal.ts";
import { ALLOCATED_TOWARD_GOAL } from "./attribute-source.ts";

export interface NamedAnalysisCharacterBuild {
  name: string;
  build: CharacterBuildSpecification;
}

export enum AnalysisCharacterBuildTypes {
  ShieldWarrior,
  TwoHandedMeleeWarrior,
  DualWieldWarrior,
  BowRogue,
  ShieldMage,
  StaffMage,
}

export const ANALYSIS_CHARACTER_BUILDS: Record<
  AnalysisCharacterBuildTypes,
  NamedAnalysisCharacterBuild
> = {
  [AnalysisCharacterBuildTypes.ShieldWarrior]: {
    name: "tank warrior",
    build: {
      mainClass: CombatantClass.Warrior,
      supportClass: CombatantClass.Rogue,
      weaponSpecialty: CharacterWeaponSpecialty.Shields,
    },
  },
  [AnalysisCharacterBuildTypes.TwoHandedMeleeWarrior]: {
    name: "2h melee warrior",
    build: {
      mainClass: CombatantClass.Warrior,
      supportClass: CombatantClass.Rogue,
      weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee,
    },
  },
  [AnalysisCharacterBuildTypes.DualWieldWarrior]: {
    name: "dual wield warrior",
    build: {
      mainClass: CombatantClass.Warrior,
      supportClass: CombatantClass.Rogue,
      weaponSpecialty: CharacterWeaponSpecialty.DualWield,
    },
  },
  [AnalysisCharacterBuildTypes.BowRogue]: {
    name: "bow rogue",
    build: {
      mainClass: CombatantClass.Rogue,
      supportClass: CombatantClass.Warrior,
      weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged,
    },
  },
  [AnalysisCharacterBuildTypes.ShieldMage]: {
    name: "shield mage",
    build: {
      mainClass: CombatantClass.Mage,
      supportClass: CombatantClass.Rogue,
      weaponSpecialty: CharacterWeaponSpecialty.Shields,
    },
  },
  [AnalysisCharacterBuildTypes.StaffMage]: {
    name: "staff mage",
    build: {
      mainClass: CombatantClass.Mage,
      supportClass: CombatantClass.Rogue,
      weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged,
    },
  },
};

/** the builds every study walks with, so their tables are read against the same characters */
export const DEFAULT_ANALYSIS_CHARACTER_BUILDS: NamedAnalysisCharacterBuild[] = [
  ANALYSIS_CHARACTER_BUILDS[AnalysisCharacterBuildTypes.TwoHandedMeleeWarrior],
  ANALYSIS_CHARACTER_BUILDS[AnalysisCharacterBuildTypes.BowRogue],
  ANALYSIS_CHARACTER_BUILDS[AnalysisCharacterBuildTypes.ShieldMage],
];

export const CASTER_DUAL_WIELD_RANGED_ANALYSIS_CHARACTER_BUILDS: NamedAnalysisCharacterBuild[] = [
  ANALYSIS_CHARACTER_BUILDS[AnalysisCharacterBuildTypes.DualWieldWarrior],
  ANALYSIS_CHARACTER_BUILDS[AnalysisCharacterBuildTypes.BowRogue],
  ANALYSIS_CHARACTER_BUILDS[AnalysisCharacterBuildTypes.ShieldMage],
];

export const CHARACTER_BUILDS_GROUP_THREE: NamedAnalysisCharacterBuild[] = [
  ANALYSIS_CHARACTER_BUILDS[AnalysisCharacterBuildTypes.ShieldWarrior],
  ANALYSIS_CHARACTER_BUILDS[AnalysisCharacterBuildTypes.BowRogue],
  ANALYSIS_CHARACTER_BUILDS[AnalysisCharacterBuildTypes.StaffMage],
];

export function defaultAnalysisCharacterSpecs(goal: AnalysisGoal) {
  return DEFAULT_ANALYSIS_CHARACTER_BUILDS.map(
    ({ name, build }) =>
      new AnalysisCharacterSpecification(name, build, goal, ALLOCATED_TOWARD_GOAL)
  );
}
