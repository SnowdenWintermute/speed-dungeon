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

/** what a score is measured in, so only scores that can be weighed against each other ever are */
export enum GoalPerformanceUnit {
  TotalAccuracy,
  SampledDamage,
  WornArmorClass,
}

export interface GoalPerformance {
  score: number;
  /**
   * False only while a goal whose build is defined by what it holds is holding something else.
   * Reaching that equipment outranks any score, so a shield build can pay for its first shield.
   */
  holdsBuildDefiningEquipment: boolean;
}

export interface GoalPerformanceChecker {
  readonly scoreUnit: GoalPerformanceUnit;
  /** the only points worth spending on this goal, so a character never allocates away from it */
  readonly allocatableAttributes: AttributePointAssignableAttributes[];
  /** equipment scoring on none of these is pruned before anyone is offered it */
  readonly equipmentScoreAxes: ((equipment: Equipment) => number)[];
  checkPerformance(combatant: Combatant, partyCurrentFloor: number): number;
}
