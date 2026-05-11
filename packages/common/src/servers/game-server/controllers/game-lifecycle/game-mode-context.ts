import { GameMessage } from "../../../../packets/game-message.js";
import { GameStateUpdate } from "../../../../packets/game-state-updates.js";
import { GameMode } from "../../../../types.js";
import { CrossServerBroadcasterService } from "../../../services/cross-server-broadcaster/index.js";
import { RaceGameRecordsService } from "../../../services/race-game-records.js";
import { RankedLadderService } from "../../../services/ranked-ladder.js";
import { SavedCharactersService } from "../../../services/saved-characters.js";
import { ServerCommand } from "../../../services/server-command/index.js";
import { UserSessionRegistry } from "../../../sessions/user-session-registry.js";
import { MessageDispatchFactory } from "../../../update-delivery/message-dispatch-factory.js";
import { GameModeStrategy } from "./game-mode-strategy.js";
import { ProgressionGameStrategy } from "./progression-game-strategy.js";
import { RankedRaceStrategy } from "./ranked-race-strategy.js";

export class GameModeContext {
  public readonly strategy: GameModeStrategy;

  constructor(
    mode: GameMode,
    private readonly raceGameRecordsService: RaceGameRecordsService,
    private readonly savedCharactersLadderService: SavedCharactersService,
    private readonly rankedLadderService: RankedLadderService,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly crossServerBroadcasterService: CrossServerBroadcasterService<
      GameStateUpdate,
      ServerCommand
    >,
    private readonly userSessionRegistry: UserSessionRegistry
  ) {
    this.strategy = this.createStrategy(mode);
  }

  private createStrategy(mode: GameMode): GameModeStrategy {
    switch (mode) {
      case GameMode.Race:
        return new RankedRaceStrategy(this.raceGameRecordsService, this.updateDispatchFactory);
      case GameMode.Progression:
        return new ProgressionGameStrategy(
          this.savedCharactersLadderService,
          this.rankedLadderService,
          this.updateDispatchFactory,
          this.crossServerBroadcasterService,
          this.userSessionRegistry
        );
    }
  }
}
