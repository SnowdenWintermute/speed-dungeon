import { CombatAttribute, Combatant } from "@speed-dungeon/common";
import { GoalPerformanceChecker } from "@/goal-performance-checkers";

/**
 * How much accuracy a character could have, so the solvers take whatever raises it and nothing else.
 *
 * Unlike the damage checker there is no "is wearing the specialty's weapon" gate. Every build starts
 * holding something other than its specialty, so the gate would report zero for the whole character
 * — discarding inherent, allocated, rings and amulet — in exactly the rooms where no accuracy
 * bearing weapon of its type has dropped. An empty main hand is the honest reading there. The
 * specialty still decides what a character will pick up, in
 * BestImprovementEquipmentSolver.tryOnEquipment.
 */
export class TotalAccuracyGoalPerformanceChecker implements GoalPerformanceChecker {
  checkPerformance(combatant: Combatant) {
    return combatant
      .getCombatantProperties()
      .attributeProperties.getAttributeValue(CombatAttribute.Accuracy);
  }

  /** nothing is rolled, so two checks of the same build already agree */
  beginComparisonScope() {}
}
