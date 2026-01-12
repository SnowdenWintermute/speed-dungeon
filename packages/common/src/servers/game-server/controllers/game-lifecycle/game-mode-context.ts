import { GameMode } from "../../../../types.js";
import { RaceGameRecordsService } from "../../../services/race-game-records.js";
import { RankedLadderService } from "../../../services/ranked-ladder.js";
import { SavedCharactersService } from "../../../services/saved-characters.js";
import { GameModeStrategy } from "./game-mode-strategy.js";
import { ProgressionGameStrategy } from "./progression-game-strategy.js";
import { RankedRaceStrategy } from "./ranked-race-strategy.js";

export class GameModeContext {
  public readonly strategy: GameModeStrategy;

  constructor(
    mode: GameMode,
    private readonly raceGameRecordsService: RaceGameRecordsService,
    private readonly savedCharactersLadderService: SavedCharactersService,
    private readonly rankedLadderService: RankedLadderService
  ) {
    this.strategy = this.createStrategy(mode);
  }

  private createStrategy(mode: GameMode): GameModeStrategy {
    switch (mode) {
      case GameMode.Race:
        return new RankedRaceStrategy(this.raceGameRecordsService);
      case GameMode.Progression:
        return new ProgressionGameStrategy(
          this.savedCharactersLadderService,
          this.rankedLadderService
        );
    }
  }
}
