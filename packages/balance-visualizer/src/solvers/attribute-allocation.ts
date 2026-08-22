import {
  AdventuringParty,
  AttributePointAssignableAttributes,
  Combatant,
  CombatAttribute,
  invariant,
} from "@speed-dungeon/common";

export class AttributeAllocationSolver {
  constructor(
    private party: AdventuringParty,
    private goalPerformanceChecker: (combatant: Combatant) => number,
    private attributesToTry: AttributePointAssignableAttributes[]
  ) {}

  private tryAllocation(
    combatant: Combatant,
    attribute: CombatAttribute,
    performanceBefore: number
  ) {
    const { attributeProperties } = combatant.getCombatantProperties();
    const totalToTry = attributeProperties.getUnspentPoints();

    const currentAllocatedValue = attributeProperties.getAllocatedAttributes()[attribute];
    attributeProperties.setSpeccedAttributeValue(attribute, currentAllocatedValue + totalToTry);
    const performanceAfter = this.goalPerformanceChecker(combatant);
    const difference = performanceAfter - performanceBefore;
    attributeProperties.setSpeccedAttributeValue(attribute, currentAllocatedValue);
    return difference;
  }

  private allocateAllToBestImproved(
    combatant: Combatant,
    toTry: AttributePointAssignableAttributes[]
  ) {
    const { attributeProperties } = combatant.getCombatantProperties();

    const performanceBefore = this.goalPerformanceChecker(combatant);
    let bestImprovementAttribute: { attribute: CombatAttribute; score: number } | null = null;
    for (const attribute of toTry) {
      const score = this.tryAllocation(combatant, attribute, performanceBefore);
      const scoreIsPositive = score > 0;
      const scoreBeatsPreviousTry =
        bestImprovementAttribute === null || bestImprovementAttribute.score < score;

      if (scoreIsPositive && scoreBeatsPreviousTry) {
        bestImprovementAttribute = { attribute, score };
      }
    }

    if (bestImprovementAttribute) {
      const totalPoints = attributeProperties.getUnspentPoints();
      for (let i = 0; i < totalPoints; i += 1) {
        attributeProperties.allocatePoint(bestImprovementAttribute.attribute);
      }
    }
  }

  /** mutates combatants in place, assigning best attribute allocations for provide goal checker */
  solve() {
    invariant(this.attributesToTry.length > 0);

    for (const combatant of this.party.combatantManager.getPartyMemberCharacters()) {
      if (combatant.getCombatantProperties().attributeProperties.getUnspentPoints() < 1) {
        continue;
      }
      this.allocateAllToBestImproved(combatant, this.attributesToTry);
    }
  }
}
