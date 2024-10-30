import {
  AdventuringParty,
  ERROR_MESSAGES,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import { GameModeStrategy } from "./index.js";

export default class ProgressionGameStrategy implements GameModeStrategy {
  onGameStart(game: SpeedDungeonGame): Promise<void | Error> {
    throw new Error("Method not implemented.");
  }
  onGameLeave(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    player: SpeedDungeonPlayer
  ): Promise<void | Error> {
    throw new Error("Method not implemented.");
  }
  onLastPlayerLeftGame(game: SpeedDungeonGame): Promise<void | Error> {
    throw new Error("Method not implemented.");
  }
  onPartyEscape(game: SpeedDungeonGame, party: AdventuringParty): Promise<void | Error> {
    throw new Error("Method not implemented.");
  }
  onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty): Promise<void | Error> {
    throw new Error("Method not implemented.");
  }
}
