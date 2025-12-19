import { ERROR_MESSAGES } from "../errors/index.js";
import { SpeedDungeonGame } from "../game/index.js";
import { GameName, Username } from "../types.js";
import { LobbyUser } from "./lobby-user.js";

/** Client app will use this to display information in the UI
 * Lobby (either on a server or locally on the client) uses this to
 * compute and send updates about the authoritative lobby state */
export class LobbyState {
  // games either being set up or already handed off to GameSimulators
  // so players can see list of joinable games and games in progress
  // and so the game setup logic can operate on the game state objects
  private games: Record<GameName, SpeedDungeonGame> = {};
  // for updating clients with the list of players not currently in games
  private users: Record<Username, LobbyUser> = {};

  addUser(user: LobbyUser) {
    const userExists = this.users[user.username] !== undefined;
    if (userExists) {
      throw new Error("Tried to add a user to a lobby but a user by that name already existed");
    }
    this.users[user.username] = user;
  }

  removeUser(username: Username) {
    delete this.users[username];
  }

  getUserOption(username: Username) {
    return this.users[username];
  }

  addGame(game: SpeedDungeonGame) {
    const gameExists = this.games[game.name] !== undefined;
    if (gameExists) {
      throw new Error("Tried to add a game to a lobby but a game by that name already existed");
    }
    this.games[game.name] = game;
  }

  removeGame(gameName: GameName) {
    delete this.games[gameName];
  }

  getGameOption(gameName: GameName) {
    return this.games[gameName];
  }

  getExpectedGame(gameName: GameName) {
    const gameOption = this.getGameOption(gameName);

    if (gameOption === undefined) {
      throw new Error(ERROR_MESSAGES.GAME_DOESNT_EXIST);
    }

    return gameOption;
  }
}
