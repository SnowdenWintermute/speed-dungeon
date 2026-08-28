import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import { Combatant } from "@speed-dungeon/common";

export interface GoalPerformance {
  /** what the combatant achieves with what it is wearing, whether or not that is its build */
  score: number;
  /**
   * Whether the loadout that produced the score is the build the study set out to measure. A
   * character reaching its build outranks any score it gives up doing so: a shield build holding a
   * two handed weapon loses damage by picking up its first shield, and would never pick one up if
   * the two were compared on score.
   */
  meetsBuildSpecification: boolean;
}

export interface GoalPerformanceChecker {
  checkPerformance(
    combatant: Combatant,
    combatantAnalysisSpec: AnalysisCharacterSpecification,
    partyCurrentFloor: number
  ): GoalPerformance;
  /**
   * Starts a scope within which every checkPerformance draws the same random numbers, so a
   * difference between two checks reflects the build change instead of the rolls. Solvers compare
   * against baselines they took earlier in the scope, so it has to cover all of their measurements.
   */
  beginComparisonScope(): void;
}
