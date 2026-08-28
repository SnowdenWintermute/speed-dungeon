import {
  AdventuringParty,
  DEEPEST_FLOOR,
  DungeonRoomType,
  Equipment,
  SpeedDungeonGame,
  throwIfLoopLimitReached,
} from "@speed-dungeon/common";
import { AllocationIntensity } from "./allocation-intensity";
import { AnalysisPartyDriver } from "./analysis-party-driver";
import { AnalysisRunReporter } from "./analysis-run-reporter";
import { AttributeAllocationSolver } from "@/solvers/attribute-allocation";
import { BestImprovementEquipmentSolver } from "@/solvers/best-improvement";
import { GoalPerformanceChecker } from "@/goal-performance-checkers";

export class AnalysisRun<TCombatantReport> {
  private partyDriver: AnalysisPartyDriver;

  constructor(
    private game: SpeedDungeonGame,
    private party: AdventuringParty,
    private equipmentSolver: BestImprovementEquipmentSolver,
    private attributeAllocationSolver: AttributeAllocationSolver,
    private goalPerformanceChecker: GoalPerformanceChecker,
    private runReporter: AnalysisRunReporter<TCombatantReport>,
    allocationIntensity: AllocationIntensity,
    private options: { honorsEquipmentRequirements: boolean }
  ) {
    this.game.addParty(this.party);
    this.partyDriver = new AnalysisPartyDriver(this.game, this.party, allocationIntensity);
  }

  /**
   * Requirements are an output of these studies, so deriving them has to read a build that no
   * requirement constrained. Honoring them instead is how you check whether that first pass moved:
   * once gates exist, builds allocate differently, and the study should be re-read to see how far.
   */
  private removeRequirementsFrom(equipment: Equipment[]) {
    if (this.options.honorsEquipmentRequirements) {
      return;
    }
    for (const item of equipment) {
      item.requirements = {};
    }
  }

  /** returns dungeon run analysis report */
  simulateRun(toIncludedFloor: number = DEEPEST_FLOOR) {
    try {
      this.partyDriver.moveToNextRoom({ isDescending: false });

      let safetyCounter = 0;
      while (this.party.dungeonExplorationManager.getCurrentFloor() <= toIncludedFloor) {
        throwIfLoopLimitReached((safetyCounter += 1));

        // clearing the room removes the monsters, so ask before it runs. a room with none neither
        // drops loot nor awards experience, so it would report the same numbers as the room before it
        const roomHasMonsters = this.party.combatantManager.monstersArePresent();

        this.partyDriver.clearCurrentRoom();
        // the solver deletes what it doesn't equip, so capture the drops before it runs
        const equipmentDroppedThisRoom = [...this.party.currentRoom.inventory.equipment];
        this.removeRequirementsFrom(equipmentDroppedThisRoom);
        // both solvers compare against baselines they take partway through, so they share one scope
        this.goalPerformanceChecker.beginComparisonScope();
        this.attributeAllocationSolver.solve();
        const { performanceByCharacter } = this.equipmentSolver.solve();

        if (roomHasMonsters) {
          this.runReporter.updateReport(performanceByCharacter, equipmentDroppedThisRoom);
        }

        if (this.party.currentRoom.roomType === DungeonRoomType.Staircase) {
          this.partyDriver.descend();
        } else {
          this.partyDriver.moveToNextRoom({ isDescending: false });
        }
      }

      return this.runReporter.runReport;
    } finally {
      this.partyDriver.restoreWornEquipmentAttributes();
    }
  }
}
