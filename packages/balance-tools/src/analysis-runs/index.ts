import {
  AdventuringParty,
  DEEPEST_FLOOR,
  DungeonRoomType,
  Equipment,
  SpeedDungeonGame,
  throwIfLoopLimitReached,
} from "@speed-dungeon/common";
import { AllocationIntensity } from "./allocation-intensity.ts";
import { AnalysisRunOptions } from "./analysis-run-options.ts";
import { AnalysisPartyDriver } from "./analysis-party-driver.ts";
import { AnalysisRunReporter } from "./analysis-run-reporter.ts";
import { AnalysisAttributeSolver } from "../solvers/analysis-attribute-solver.ts";
import { BestImprovementEquipmentSolver } from "../solvers/best-improvement.ts";
import { ComparisonRollScope } from "./comparison-roll-scope.ts";

export class AnalysisRun<TCombatantReport> {
  private partyDriver: AnalysisPartyDriver;

  constructor(
    private game: SpeedDungeonGame,
    private party: AdventuringParty,
    private equipmentSolver: BestImprovementEquipmentSolver,
    private attributeSolvers: AnalysisAttributeSolver[],
    private comparisonRollScope: ComparisonRollScope,
    private runReporter: AnalysisRunReporter<TCombatantReport>,
    allocationIntensity: AllocationIntensity,
    private options: AnalysisRunOptions
  ) {
    this.game.addParty(this.party);
    this.partyDriver = new AnalysisPartyDriver(this.game, this.party, allocationIntensity);
  }

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

        const roomHasMonsters = this.party.combatantManager.monstersArePresent();

        this.partyDriver.clearCurrentRoom();

        const equipmentDroppedThisRoom = [...this.party.currentRoom.inventory.equipment];
        this.removeRequirementsFrom(equipmentDroppedThisRoom);

        this.comparisonRollScope.begin();
        for (const attributeSolver of this.attributeSolvers) {
          attributeSolver.solve();
        }
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
