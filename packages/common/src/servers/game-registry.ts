import { GameName } from "../aliases.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { GameListEntry } from "../packets/game-state-updates.js";

export class GameRegistry {
  private _games = new Map<GameName, SpeedDungeonGame>();

  get games(): ReadonlyMap<GameName, SpeedDungeonGame> {
    return this._games;
  }

  registerGame(game: SpeedDungeonGame) {
    const gameExists = this._games.get(game.name) !== undefined;
    if (gameExists) {
      throw new Error("Tried to add a game to a lobby but a game by that name already existed");
    }
    this._games.set(game.name, game);
  }

  unregisterGame(gameName: GameName) {
    this._games.delete(gameName);
  }

  getGameOption(gameName: GameName) {
    return this._games.get(gameName);
  }

  requireGame(gameName: GameName) {
    const gameOption = this.getGameOption(gameName);
    if (gameOption === undefined) {
      console.trace();
      throw new Error(ERROR_MESSAGES.GAME.NOT_FOUND);
    }

    return gameOption;
  }

  getGamesList() {
    return Array.from(this._games).map(([gameName, game]) => {
      return new GameListEntry(
        gameName as GameName,
        game.getPlayerCount(),
        game.mode,
        game.getTimeStarted(),
        game.isRanked
      );
    });
  }
}
