import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import { Combatant } from "@speed-dungeon/common";

export enum GoalPerformanceCheckerType {
  TotalAccuracy,
  SampledAttackDamageOnTargetDummy,
}

export interface GoalPerformance {
  score: number;
  /** Meeting build spec overrides not meeting it, but we still want to record the score. */
  meetsBuildSpecification: boolean;
}

export interface GoalPerformanceChecker {
  type: GoalPerformanceCheckerType;
  checkPerformance(
    combatant: Combatant,
    combatantAnalysisSpec: AnalysisCharacterSpecification,
    partyCurrentFloor: number
  ): GoalPerformance;
  // sets a seeded RNG so all tries on a comparison get same numbers rolled
  beginComparisonScope(): void;
}
