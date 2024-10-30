import { AdventuringParty, SpeedDungeonGame, SpeedDungeonPlayer } from "@speed-dungeon/common";
import { GameModeStrategy } from "./index.js";
import { raceGameRecordsRepo } from "../../../database/repos/race-game-records.js";

export default class RankedRaceStrategy implements GameModeStrategy {
  onGameStart(game: SpeedDungeonGame): Promise<Error | void> {
    return raceGameRecordsRepo.insertGameRecord(game);
  }
  async onGameLeave(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    player: SpeedDungeonPlayer
  ): Promise<Error | void> {
    if (!game.timeStarted) return Promise.resolve();

    try {
      for (const character of Object.values(party.characters)) {
        if (character.combatantProperties.controllingPlayer !== player.username) continue;
        await raceGameRecordsRepo.updatePlayerCharacterRecord(character);
      }
    } catch (error) {
      return error as unknown as Error;
    }

    return Promise.resolve();
  }
  onLastPlayerLeftGame(game: SpeedDungeonGame): Promise<Error | void> {
    return raceGameRecordsRepo.markGameAsCompleted(game.id);
  }
  onPartyDissolve(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    throw new Error("Method not implemented.");
  }
  onPartyEscape(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    throw new Error("Method not implemented.");
  }
  onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

// if (game.timeStarted) return raceGameRecordsRepo.markGameAsCompleted(game.id);
// on player disconnect / game leave
// - update their character record's levels
// - if they were last one alive in their party to leave
//     - update their entire party's character records
//     - if at least 1 other party
//       - notify other parties of their defeat
//       - if there is only one other party, set that party as victors
