import type {
  AttributePointAssignableAttributes,
  Combatant,
  Equipment,
} from "@speed-dungeon/common";

export enum GoalPerformanceCheckerType {
  TotalAccuracy,
  SampledDamageOnTargetDummy,
  WornArmorClass,
}

export interface GoalPerformance {
  score: number;
  isWearingHoldableSpecialty: boolean;
}

export interface GoalPerformanceChecker {
  /** the only points worth spending on this goal, so a character never allocates away from it */
  readonly allocatableAttributes: AttributePointAssignableAttributes[];
  /** equipment scoring on none of these is pruned before anyone is offered it */
  readonly equipmentScoreAxes: ((equipment: Equipment) => number)[];
  checkPerformance(combatant: Combatant, partyCurrentFloor: number): number;
}
