import {
  AdventuringParty,
  CharacterControlScheme,
  DEEPEST_FLOOR,
  DungeonRoomType,
  GameId,
  GameMode,
  GameName,
  PartyId,
  PartyName,
  SpeedDungeonGame,
  throwIfLoopLimitReached,
} from "@speed-dungeon/common";
import { AnalysisPartyDriver } from "./analysis-party-driver";
import { BestImprovementEquipmentSolver } from "@/equipment-solvers/best-improvement";
import { AnalysisRunReporter } from "./analysis-run-reporter";

export class AnalysisRun<ReportType> {
  private partyDriver: AnalysisPartyDriver;
  private game = new SpeedDungeonGame(
    "game id" as GameId,
    "game name" as GameName,
    GameMode.UnrankedRace,
    CharacterControlScheme.Captain
  );
  private party = AdventuringParty.createInitialized(
    "party id" as PartyId,
    "party name" as PartyName
  );

  constructor(
    private equipmentSolver: BestImprovementEquipmentSolver,
    private runReporter: AnalysisRunReporter<ReportType>
  ) {
    this.game.addParty(this.party);
    this.partyDriver = new AnalysisPartyDriver(this.game, this.party);
  }

  private removeRequirementsFromDroppedEquipment() {
    for (const equipment of this.party.currentRoom.inventory.equipment) {
      equipment.requirements = {};
    }
  }

  /** returns dungeon run analysis report */
  simulateRun(toIncludedFloor: number = DEEPEST_FLOOR) {
    let safetyCounter = 0;
    while (this.party.dungeonExplorationManager.getCurrentFloor() <= toIncludedFloor) {
      throwIfLoopLimitReached((safetyCounter += 1));

      if (this.party.currentRoom.roomType === DungeonRoomType.Staircase) {
        this.partyDriver.moveToNextFloor();
      }

      // drops items/experience from that room
      this.partyDriver.clearCurrentRoom();
      this.removeRequirementsFromDroppedEquipment();
      // runs the attribute solver on the party, mutating in place
      const { performanceByCharacter, unusedEquipment } = this.equipmentSolver.solve();
      this.runReporter.updateReport(performanceByCharacter, unusedEquipment);
      this.partyDriver.moveToNextRoom();
    }
  }
}

// still needs
// - attribute solver
