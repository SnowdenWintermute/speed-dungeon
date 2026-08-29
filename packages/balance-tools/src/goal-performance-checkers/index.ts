import type { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import type {
  AttributePointAssignableAttributes,
  Combatant,
  Equipment,
} from "@speed-dungeon/common";

export enum GoalPerformanceCheckerType {
  TotalAccuracy,
  SampledDamageOnTargetDummy,
}

/** what a score is measured in, so only scores that can be weighed against each other ever are */
export enum GoalPerformanceUnit {
  TotalAccuracy,
  SampledDamage,
}

export interface GoalPerformance {
  score: number;
  /** Meeting build spec overrides not meeting it, but we still want to record the score. */
  meetsBuildSpecification: boolean;
}

export interface GoalPerformanceChecker {
  readonly scoreUnit: GoalPerformanceUnit;
  /** the only points worth spending on this goal, so a character never allocates away from it */
  readonly allocatableAttributes: AttributePointAssignableAttributes[];
  /** equipment scoring on none of these is pruned before anyone is offered it */
  readonly equipmentScoreAxes: ((equipment: Equipment) => number)[];
  checkPerformance(
    combatant: Combatant,
    combatantAnalysisSpec: AnalysisCharacterSpecification,
    partyCurrentFloor: number
  ): GoalPerformance;
}
