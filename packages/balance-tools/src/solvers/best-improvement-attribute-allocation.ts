import { Combatant, CombatAttribute, invariant } from "@speed-dungeon/common";
import type { AttributePointAssignableAttributes } from "@speed-dungeon/common";

export class BestImprovementAttributeAllocation {
  private static measureImprovement(
    combatant: Combatant,
    attribute: CombatAttribute,
    checkPerformance: () => number,
    performanceBefore: number,
    pointsCount: number
  ) {
    const { attributeProperties } = combatant.getCombatantProperties();

    const currentAllocatedValue = attributeProperties.getAllocatedAttributes()[attribute];
    attributeProperties.setSpeccedAttributeValue(attribute, currentAllocatedValue + pointsCount);
    const performanceAfter = checkPerformance();
    attributeProperties.setSpeccedAttributeValue(attribute, currentAllocatedValue);

    return performanceAfter - performanceBefore;
  }

  static allocate(
    combatant: Combatant,
    allocatableAttributes: AttributePointAssignableAttributes[],
    pointsCount: number,
    checkPerformance: () => number
  ) {
    if (pointsCount < 1) {
      return;
    }

    invariant(
      allocatableAttributes.length > 0,
      "a goal with nothing to allocate to cannot improve"
    );

    const performanceBefore = checkPerformance();
    let bestImprovementAttribute: { attribute: CombatAttribute; score: number } | null = null;
    for (const attribute of allocatableAttributes) {
      const score = BestImprovementAttributeAllocation.measureImprovement(
        combatant,
        attribute,
        checkPerformance,
        performanceBefore,
        pointsCount
      );
      const scoreIsPositive = score > 0;
      const scoreBeatsPreviousTry =
        bestImprovementAttribute === null || bestImprovementAttribute.score < score;

      if (scoreIsPositive && scoreBeatsPreviousTry) {
        bestImprovementAttribute = { attribute, score };
      }
    }

    if (bestImprovementAttribute === null) {
      return;
    }

    const { attributeProperties } = combatant.getCombatantProperties();
    for (let allocated = 0; allocated < pointsCount; allocated += 1) {
      attributeProperties.allocatePoint(bestImprovementAttribute.attribute);
    }
  }
}
