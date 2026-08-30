import {
  AttributePointAssignableAttributes,
  CombatAttribute,
  Combatant,
  Equipment,
} from "@speed-dungeon/common";
import { GoalPerformanceChecker } from "./index.ts";

export class TotalAccuracyGoalPerformanceChecker implements GoalPerformanceChecker {
  constructor(
    readonly allocatableAttributes: AttributePointAssignableAttributes[],
    readonly equipmentScoreAxes: ((equipment: Equipment) => number)[]
  ) {}

  checkPerformance(combatant: Combatant) {
    return combatant
      .getCombatantProperties()
      .attributeProperties.getAttributeValue(CombatAttribute.Accuracy);
  }
}
