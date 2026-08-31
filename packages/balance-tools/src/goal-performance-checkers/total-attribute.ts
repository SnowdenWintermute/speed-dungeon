import {
  AttributePointAssignableAttributes,
  CombatAttribute,
  Combatant,
  Equipment,
} from "@speed-dungeon/common";
import { GoalPerformanceChecker } from "./index.ts";

/** the attribute scored is not always one that can be allocated: speed is bought with agility and
 * accuracy with dexterity, and either derivation may stop being one for one */
export class TotalAttributeGoalPerformanceChecker implements GoalPerformanceChecker {
  constructor(
    private attribute: CombatAttribute,
    readonly allocatableAttributes: AttributePointAssignableAttributes[],
    readonly equipmentScoreAxes: ((equipment: Equipment) => number)[]
  ) {}

  checkPerformance(combatant: Combatant) {
    return combatant
      .getCombatantProperties()
      .attributeProperties.getAttributeValue(this.attribute);
  }
}
