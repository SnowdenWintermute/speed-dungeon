import { GameName } from "../aliases.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { GameListEntry } from "../packets/game-state-updates.js";

export class GameRegistry {
  private games = new Map<GameName, SpeedDungeonGame>();

  registerGame(game: SpeedDungeonGame) {
    const gameExists = this.games.get(game.name) !== undefined;
    if (gameExists) {
      throw new Error("Tried to add a game to a lobby but a game by that name already existed");
    }
    this.games.set(game.name, game);
    console.log("set game in registry", game.name);
  }

  unregisterGame(gameName: GameName) {
    console.log("unregisterGame by name", gameName);
    this.games.delete(gameName);
  }

  getGameOption(gameName: GameName) {
    return this.games.get(gameName);
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
    return Array.from(this.games).map(([gameName, game]) => {
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
