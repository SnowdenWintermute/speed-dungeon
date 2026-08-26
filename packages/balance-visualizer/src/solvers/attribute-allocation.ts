import { AnalysisSpecHolder } from "@/analysis-runs/analysis-spec-holder";
import { GoalPerformanceChecker } from "@/goal-performance-checkers";
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
    private analysisSpecsHolder: AnalysisSpecHolder,
    private goalPerformanceChecker: GoalPerformanceChecker,
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
    const currentFloor = this.party.dungeonExplorationManager.getCurrentFloor();
    const spec = this.analysisSpecsHolder.requireSpec(combatant.getEntityId());
    // allocation moves no equipment, so it can't change whether the build specification is met
    const { score: performanceAfter } = this.goalPerformanceChecker.checkPerformance(
      combatant,
      spec,
      currentFloor
    );
    const difference = performanceAfter - performanceBefore;
    attributeProperties.setSpeccedAttributeValue(attribute, currentAllocatedValue);
    return difference;
  }

  private allocateAllToBestImproved(
    combatant: Combatant,
    toTry: AttributePointAssignableAttributes[]
  ) {
    const { attributeProperties } = combatant.getCombatantProperties();

    const currentFloor = this.party.dungeonExplorationManager.getCurrentFloor();
    const spec = this.analysisSpecsHolder.requireSpec(combatant.getEntityId());
    const { score: performanceBefore } = this.goalPerformanceChecker.checkPerformance(
      combatant,
      spec,
      currentFloor
    );
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
