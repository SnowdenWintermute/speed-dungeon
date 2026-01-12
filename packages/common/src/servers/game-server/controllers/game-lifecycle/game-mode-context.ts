import { GameMode } from "../../../../types.js";
import { GameModeStrategy } from "./game-mode-strategy.js";
import ProgressionGameStrategy from "./progression-game-strategy.js";
import RankedRaceStrategy from "./ranked-race-strategy.js";

export class GameModeContext {
  public readonly strategy: GameModeStrategy;

  constructor(mode: GameMode) {
    this.strategy = this.createStrategy(mode);
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
