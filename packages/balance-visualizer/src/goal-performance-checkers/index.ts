import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { Combatant } from "@speed-dungeon/common";

export interface GoalPerformanceChecker {
  checkPerformance(
    combatant: Combatant,
    combatantAnalysisSpec: AnalysisCharacterSpecification,
    partyCurrentFloor: number
  ): number;
  /**
   * Starts a scope within which every checkPerformance draws the same random numbers, so a
   * difference between two checks reflects the build change instead of the rolls. Solvers compare
   * against baselines they took earlier in the scope, so it has to cover all of their measurements.
   */
  beginComparisonScope(): void;
}
