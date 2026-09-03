import { AllocationIntensity } from "../analysis-runs/allocation-intensity.ts";
import { AnalysisSubjects } from "../analysis-runs/analysis-subjects.ts";
import { AttributeSourceType } from "../analysis-subjects/attribute-source.ts";
import { AnalysisAttributeSolver } from "./analysis-attribute-solver.ts";
import { BestImprovementAttributeAllocation } from "./best-improvement-attribute-allocation.ts";
import { AdventuringParty, COMBAT_ATTRIBUTES, Combatant } from "@speed-dungeon/common";

export class AttributeAllocationSolver implements AnalysisAttributeSolver {
  constructor(
    private party: AdventuringParty,
    private analysisSubjects: AnalysisSubjects,
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

  /** mutates combatants in place, assigning each their best allocation for their own goal */
  solve() {
    for (const combatant of this.party.combatantManager.getPartyMemberCharacters()) {
      const { attributeSource } = this.analysisSubjects.requireSpec(combatant.getEntityId());
      if (attributeSource.type !== AttributeSourceType.AllocatedTowardGoal) {
        continue;
      }

      const pointsToAllocate = this.getPointsToAllocate(combatant);
      if (pointsToAllocate < 1) {
        continue;
      }

      // allocation moves no equipment, so it can't change whether the build specification is met
      const checkPerformance = () =>
        this.analysisSubjects.checkPerformance(
          combatant,
          this.party.dungeonExplorationManager.getCurrentFloor()
        ).score;
      const { allocatableAttributes } = this.analysisSubjects.requireGoalPerformanceChecker(
        combatant.getEntityId()
      );

      BestImprovementAttributeAllocation.allocate(
        combatant,
        allocatableAttributes,
        pointsToAllocate,
        checkPerformance
      );
    }
  }
}
