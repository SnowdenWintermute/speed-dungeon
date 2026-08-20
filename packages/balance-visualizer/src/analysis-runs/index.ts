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

export class AnalysisRun {
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

  constructor(private equipmentSolver: BestImprovementEquipmentSolver) {
    this.game.addParty(this.party);
    this.partyDriver = new AnalysisPartyDriver(this.game, this.party);
  }

  private updateReport() {
    //  - creates a report of the current room
    //    - based on a passed report factory object
    //      - takes in the party
    //      - returns some desired info, like
    //        - combatant goal performance
    //        - current weapon types worn
    //        - current attribute allocation
    //        - current attribute totals
    //        - total available attributes from equipment
    //          that could fit in party slot capacity
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
      // runs the attribute solver on the party, mutating in place
      // runs the equipment solver on the party, mutating in place
      this.equipmentSolver.solve();
      // update report
      // moves them to next room
      this.partyDriver.moveToNextRoom();
    }
  }
}

// still needs
// - attribute solver
// - run reporter
