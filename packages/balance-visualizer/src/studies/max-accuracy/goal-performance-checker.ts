import { CombatAttribute, Combatant } from "@speed-dungeon/common";
import { GoalPerformance, GoalPerformanceChecker } from "@/goal-performance-checkers";

/**
 * How much accuracy a character could have, so the solvers take whatever raises it and nothing else.
 *
 * Regardless if starting gear meets the specification we still want to measure their accuracy.
 * Non-specification matching equipment will never be tried on, in
 * BestImprovementEquipmentSolver.tryOnEquipment.
 */
export class TotalAccuracyGoalPerformanceChecker implements GoalPerformanceChecker {
  checkPerformance(combatant: Combatant): GoalPerformance {
    return {
      score: combatant
        .getCombatantProperties()
        .attributeProperties.getAttributeValue(CombatAttribute.Accuracy),
      meetsBuildSpecification: true,
    };
  }

  /** nothing is rolled, so two checks of the same build already agree */
  beginComparisonScope() {}
}
