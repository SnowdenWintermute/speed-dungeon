import { CombatantClass } from "@speed-dungeon/common";

export class AnalysisCharacterSpecification {
  constructor(public readonly characterBuildSpec: CharacterBuildSpecification) {}
  // - AutoAttackOptimizationIntensity | AttributeIntensity<CombatAttribute>
  // - GoalMeasure: () => GoalPoints (arbitrary number)
}

export enum CharacterWeaponSpecialty {
  TwoHandedMelee,
  TwoHandedRanged,
  DualWield,
  Shields,
}

export interface CharacterBuildSpecification {
  weaponSpecialty: CharacterWeaponSpecialty;
  mainClass: CombatantClass;
  supportClass: CombatantClass;
}
