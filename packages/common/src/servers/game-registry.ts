import { GameId, GameName } from "../aliases.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { GameListEntry } from "../packets/game-state-updates.js";

export class GameRegistry {
  private _games = new Map<GameId, SpeedDungeonGame>();
  private _gameNamesToIds = new Map<GameName, GameId>();

  get games(): ReadonlyMap<GameId, SpeedDungeonGame> {
    return this._games;
  }

  registerGame(game: SpeedDungeonGame) {
    const gameExists = this._games.get(game.id) !== undefined;
    if (gameExists) {
      throw new Error("Tried to add a game to a lobby but a game by that name already existed");
    }
    this._games.set(game.id, game);
    this._gameNamesToIds.set(game.name, game.id);
  }

  unregisterGame(gameId: GameId) {
    const gameOption = this.getGameOption(gameId);
    this._games.delete(gameId);
    if (gameOption) {
      this._gameNamesToIds.delete(gameOption.name);
    }
  }

  getGameOption(gameId: GameId) {
    return this._games.get(gameId);
  }

  getGameOptionByName(gameName: GameName) {
    const gameIdOption = this._gameNamesToIds.get(gameName);
    if (!gameIdOption) return undefined;
    return this._games.get(gameIdOption);
  }

  requireGame(gameId: GameId) {
    const gameOption = this.getGameOption(gameId);
    if (gameOption === undefined) {
      console.trace();
      throw new Error(ERROR_MESSAGES.GAME.NOT_FOUND);
    }

    return gameOption;
  }

  getGamesList() {
    return Array.from(this._games).map(([id, game]) => {
      return new GameListEntry(
        game.name,
        game.id,
        game.getPlayerCount(),
        game.mode,
        game.getTimeStarted(),
        game.isRanked
      );
    });
  }
}
