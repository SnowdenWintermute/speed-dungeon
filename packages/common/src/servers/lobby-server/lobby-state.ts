import { Username } from "../../aliases.js";
import { GameRegistry } from "../game-registry.js";

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
  public readonly gameRegistry = new GameRegistry();
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

  removeExpectedUserInLobbyChannel(username: Username) {
    const userRemoved = this.removeUserIfInLobbyChannel(username);
    if (!userRemoved) {
      throw new Error("Expected a user to exist when removing them from lobby channel");
    }
  }

  removeUserIfInLobbyChannel(username: Username) {
    const userOption = this.usersInLobbyChannel.get(username);
    if (userOption === undefined) {
      return false;
    }

    userOption.sessionsInThisChannelCount -= 1;

    if (userOption.sessionsInThisChannelCount < 0) {
      throw new Error(`User ${username} session count went negative`);
    }

    if (userOption.sessionsInThisChannelCount === 0) {
      this.usersInLobbyChannel.delete(username);
    }
    return true;
  }

  getUsersList() {
    return this.usersInLobbyChannel;
  }
}
