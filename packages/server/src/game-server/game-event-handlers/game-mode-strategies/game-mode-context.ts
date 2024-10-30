import {
  AdventuringParty,
  GameMode,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import { GameModeStrategy } from ".";
import RankedRaceStrategy from "./ranked-race-strategy.js";
import ProgressionGameStrategy from "./progression-game-strategy.js";

export default class GameModeContext implements GameModeStrategy {
  private strategy: GameModeStrategy;

  constructor(mode: GameMode) {
    this.strategy = this.createStrategy(mode);
  }

  onGameStart(game: SpeedDungeonGame): Promise<void | Error> {
    return this.strategy.onGameStart(game);
  }
  onGameLeave(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    player: SpeedDungeonPlayer
  ): Promise<void | Error> {
    return this.strategy.onGameLeave(game, party, player);
  }
  onLastPlayerLeftGame(game: SpeedDungeonGame): Promise<void | Error> {
    return this.strategy.onLastPlayerLeftGame(game);
  }
  onPartyEscape(game: SpeedDungeonGame, party: AdventuringParty): Promise<void | Error> {
    return this.strategy.onPartyEscape(game, party);
  }
  onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty): Promise<void | Error> {
    return this.strategy.onPartyWipe(game, party);
  }

  private createStrategy(mode: GameMode): GameModeStrategy {
    switch (mode) {
      case GameMode.Race:
        return new RankedRaceStrategy();
      case GameMode.Progression:
        return new ProgressionGameStrategy();
    }
  }
}
