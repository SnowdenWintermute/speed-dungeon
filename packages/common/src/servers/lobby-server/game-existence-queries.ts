import { GameId, GameName } from "../../aliases.js";
import { GameSessionStoreService } from "../services/game-session-store/index.js";
import { LobbyState } from "./lobby-state.js";

export class GameExistenceChecker {
  constructor(
    private lobbyState: LobbyState,
    private gameSessionStoreService: GameSessionStoreService
  ) {}

  async gameExistsByName(gameName: GameName): Promise<boolean> {
    return Boolean(
      this.lobbyState.gameRegistry.getGameOptionByName(gameName) ||
        (await this.gameSessionStoreService.getPendingGameSetupByName(gameName)) ||
        (await this.gameSessionStoreService.getActiveGameStatusByName(gameName))
    );
  }

  async gameExistsById(gameId: GameId): Promise<boolean> {
    return Boolean(
      this.lobbyState.gameRegistry.getGameOption(gameId) ||
        (await this.gameSessionStoreService.getPendingGameSetup(gameId)) ||
        (await this.gameSessionStoreService.getActiveGameStatus(gameId))
    );
  }
}
