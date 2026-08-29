import {
  AttributePointAssignableAttributes,
  CombatAttribute,
  Combatant,
} from "@speed-dungeon/common";
import { GoalPerformance, GoalPerformanceChecker, GoalPerformanceUnit } from "./index.ts";
import { EQUIPMENT_SCORE_DOMINATION_AXES } from "../solvers/equipment-score-domination-axes.ts";

export class TotalAccuracyGoalPerformanceChecker implements GoalPerformanceChecker {
  readonly scoreUnit = GoalPerformanceUnit.TotalAccuracy;
  // accuracy is not point assignable, so dexterity is the only allocation that moves it
  readonly allocatableAttributes: AttributePointAssignableAttributes[] = [CombatAttribute.Dexterity];
  // an item carrying neither affix is pruned as scoring on no axis, which is what we want: it
  // supplies no accuracy, so it says nothing about how much was available
  readonly equipmentScoreAxes = [
    EQUIPMENT_SCORE_DOMINATION_AXES.dexterity,
    EQUIPMENT_SCORE_DOMINATION_AXES.accuracy,
  ];

  checkPerformance(combatant: Combatant): GoalPerformance {
    return {
      score: combatant
        .getCombatantProperties()
        .attributeProperties.getAttributeValue(CombatAttribute.Accuracy),
      meetsBuildSpecification: true,
    };
  }
}
