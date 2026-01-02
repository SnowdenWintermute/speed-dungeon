import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { GameListEntry } from "../../packets/game-state-updates.js";
import { GameName, Username } from "../../aliases.js";

export enum UserAuthStatus {
  LoggedIn,
  Guest,
}

export class UserChannelDisplayData {
  sessionsInThisChannelCount: number = 1;
  constructor(public authStatus: UserAuthStatus) {}
}

/** Client app will use this to display information in the UI
 * Lobby (either on a server or locally on the client) uses this to
 * compute and send updates about the authoritative lobby state */
export class LobbyState {
  // games either being set up or already handed off to GameSimulators
  // so players can see list of joinable games and games in progress
  // and so the game setup logic can operate on the game state objects
  private games: Record<GameName, SpeedDungeonGame> = {};
  // for updating clients with the list of players not currently in games
  private usersInLobbyChannel = new Map<Username, UserChannelDisplayData>();

  /**Users can have more than one session in a single channel so we'll update a reference count
   * to avoid displaying duplicate names for example when an authorized user has multiple tabs open */
  addUser(username: Username, isAuthorized: boolean) {
    const existingUser = this.usersInLobbyChannel.get(username);
    if (existingUser) {
      existingUser.sessionsInThisChannelCount += 1;
      return existingUser;
    }

    const authStatus = isAuthorized ? UserAuthStatus.LoggedIn : UserAuthStatus.Guest;
    const userChannelDisplayData = new UserChannelDisplayData(authStatus);
    this.usersInLobbyChannel.set(username, userChannelDisplayData);
    return userChannelDisplayData;
  }

  removeUser(username: Username) {
    const expectedUser = this.usersInLobbyChannel.get(username);
    if (expectedUser === undefined) {
      throw new Error("Tried to remove a user but couldn't find it");
    }

    expectedUser.sessionsInThisChannelCount -= 1;

    if (expectedUser.sessionsInThisChannelCount < 0) {
      throw new Error(`User ${username} session count went negative`);
    }

    if (expectedUser.sessionsInThisChannelCount === 0) {
      this.usersInLobbyChannel.delete(username);
    }
  }

  getUsersList() {
    return this.usersInLobbyChannel;
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

  getGamesList() {
    return Object.entries(this.games).map(
      ([gameName, game]) =>
        new GameListEntry(
          gameName as GameName,
          Object.keys(game.players).length,
          game.mode,
          game.timeStarted,
          game.isRanked
        )
    );
  }
}
