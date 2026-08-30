import {
  AttributePointAssignableAttributes,
  CombatAttribute,
  Combatant,
  Equipment,
} from "@speed-dungeon/common";
import { GoalPerformance, GoalPerformanceChecker, GoalPerformanceUnit } from "./index.ts";

export class TotalAccuracyGoalPerformanceChecker implements GoalPerformanceChecker {
  readonly scoreUnit = GoalPerformanceUnit.TotalAccuracy;

  constructor(
    readonly allocatableAttributes: AttributePointAssignableAttributes[],
    readonly equipmentScoreAxes: ((equipment: Equipment) => number)[]
  ) {}

  checkPerformance(combatant: Combatant): GoalPerformance {
    return {
      score: combatant
        .getCombatantProperties()
        .attributeProperties.getAttributeValue(CombatAttribute.Accuracy),
      meetsBuildSpecification: true,
    };
  }
}
