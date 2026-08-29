import { CombatAttribute, Combatant } from "@speed-dungeon/common";
import {
  GoalPerformance,
  GoalPerformanceChecker,
  GoalPerformanceCheckerType,
} from "../../goal-performance-checkers/index.ts";

export class TotalAccuracyGoalPerformanceChecker implements GoalPerformanceChecker {
  readonly type = GoalPerformanceCheckerType.TotalAccuracy;
  checkPerformance(combatant: Combatant): GoalPerformance {
    return {
      score: combatant
        .getCombatantProperties()
        .attributeProperties.getAttributeValue(CombatAttribute.Accuracy),
      meetsBuildSpecification: true,
    };
  }

  beginComparisonScope() {}
}
