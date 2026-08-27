import { AllocationIntensity } from "@/analysis-runs/allocation-intensity";
import { AnalysisSpecHolder } from "@/analysis-runs/analysis-spec-holder";
import { GoalPerformanceChecker } from "@/goal-performance-checkers";
import {
  AdventuringParty,
  AttributePointAssignableAttributes,
  COMBAT_ATTRIBUTES,
  Combatant,
  CombatAttribute,
  invariant,
} from "@speed-dungeon/common";

export class AttributeAllocationSolver {
  constructor(
    private party: AdventuringParty,
    private analysisSpecsHolder: AnalysisSpecHolder,
    private goalPerformanceChecker: GoalPerformanceChecker,
    private attributesToTry: AttributePointAssignableAttributes[],
    private allocationIntensity: AllocationIntensity
  ) {}

  /** the intensity is taken against every point the combatant has ever been granted rather than
   * against what is currently unspent, so that spending is capped at a share of a career's points
   * instead of draining whatever stock happens to be on hand. the points a floor leaves behind are
   * offered again on the next level up, when the larger cumulative total may fit another whole one */
  private getPointsToAllocate(combatant: Combatant) {
    const { attributeProperties } = combatant.getCombatantProperties();
    const unspentPoints = attributeProperties.getUnspentPoints();

    const allocatedAttributes = attributeProperties.getAllocatedAttributes();
    let allocatedPoints = 0;
    for (const attribute of COMBAT_ATTRIBUTES) {
      allocatedPoints += allocatedAttributes[attribute];
    }

    const grantedPoints = unspentPoints + allocatedPoints;
    const targetAllocatedPoints = this.allocationIntensity.pointsTowardGoal(grantedPoints);

    return Math.min(Math.max(targetAllocatedPoints - allocatedPoints, 0), unspentPoints);
  }

  private tryAllocation(
    combatant: Combatant,
    attribute: CombatAttribute,
    performanceBefore: number,
    pointsToAllocate: number
  ) {
    const { attributeProperties } = combatant.getCombatantProperties();

    const currentAllocatedValue = attributeProperties.getAllocatedAttributes()[attribute];
    attributeProperties.setSpeccedAttributeValue(
      attribute,
      currentAllocatedValue + pointsToAllocate
    );
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

  private allocateToBestImproved(
    combatant: Combatant,
    toTry: AttributePointAssignableAttributes[]
  ) {
    const pointsToAllocate = this.getPointsToAllocate(combatant);
    if (pointsToAllocate < 1) {
      return;
    }

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
      const score = this.tryAllocation(combatant, attribute, performanceBefore, pointsToAllocate);
      const scoreIsPositive = score > 0;
      const scoreBeatsPreviousTry =
        bestImprovementAttribute === null || bestImprovementAttribute.score < score;

      if (scoreIsPositive && scoreBeatsPreviousTry) {
        bestImprovementAttribute = { attribute, score };
      }
    }

    if (bestImprovementAttribute) {
      for (let i = 0; i < pointsToAllocate; i += 1) {
        attributeProperties.allocatePoint(bestImprovementAttribute.attribute);
      }
    }
  }

  /** mutates combatants in place, assigning best attribute allocations for provide goal checker */
  solve() {
    invariant(this.attributesToTry.length > 0);

    for (const combatant of this.party.combatantManager.getPartyMemberCharacters()) {
      this.allocateToBestImproved(combatant, this.attributesToTry);
    }
  }
}
