import { ERROR_MESSAGES } from "../../errors/index.js";
import {
  ActionValidity,
  ChannelName,
  ConnectionId,
  GameName,
  PartyName,
  SpeedDungeonGame,
  Username,
} from "../../index.js";
import { UserId } from "./user-ids.js";
import { UserSessionRegistry } from "./user-session-registry.js";

export class UserSession {
  public currentGameName: null | GameName = null;
  public currentPartyName: null | PartyName = null;
  private channelsSubscribedTo = new Set<ChannelName>();

  constructor(
    public readonly username: Username,
    /** either a socket.id or a locally generated UUID on client */
    public readonly connectionId: ConnectionId,
    public readonly userId: UserId,
    public getExpectedCurrentGame: () => SpeedDungeonGame
  ) {}

  isSubscribedToChannel(channelName: ChannelName) {
    return this.channelsSubscribedTo.has(channelName);
  }

  isInGame() {
    return this.currentGameName !== null;
  }

  // getExpectedCurrentGame(lobbyState: LobbyState) {
  //   const currentGameName = this.currentGameName;
  //   if (currentGameName === null) {
  //     throw new Error(ERROR_MESSAGES.USER.NO_CURRENT_GAME);
  //   }

  //   return lobbyState.getExpectedGame(currentGameName);
  // }

  getCurrentPartyOption(game: SpeedDungeonGame) {
    if (this.currentPartyName === null) {
      return null;
    }

    try {
      return game.getExpectedParty(this.currentPartyName);
    } catch {
      throw new Error("User session had a party name for a party that did not exist");
    }
  }

  getExpectedCurrentParty(game: SpeedDungeonGame) {
    if (this.currentPartyName === null) {
      throw new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);
    }

    return game.getExpectedParty(this.currentPartyName);
  }

  canJoinNewGame(isRanked?: boolean): ActionValidity {
    if (this.isInGame()) {
      return new ActionValidity(false, ERROR_MESSAGES.LOBBY.ALREADY_IN_GAME);
    }

    const userIsGuest = this.userId === null;
    if (isRanked && userIsGuest) {
      return new ActionValidity(false, ERROR_MESSAGES.AUTH.REQUIRED);
    }

    return new ActionValidity(true);
  }

  joinGame(game: SpeedDungeonGame) {
    game.registerPlayerFromLobbyUser(this.username);
    this.currentGameName = game.name;
  }

  subscribeToChannel(channelName: ChannelName) {
    if (this.channelsSubscribedTo.has(channelName)) {
      throw new Error("Tried to subscribe to a channel but was already subscribed to it");
    }
    this.channelsSubscribedTo.add(channelName);
  }

  unsubscribeFromChannel(channelName: ChannelName) {
    if (!this.channelsSubscribedTo.has(channelName)) {
      throw new Error("Tried to unsubscribe to a channel but was not subscribed to it");
    }
    this.channelsSubscribedTo.delete(channelName);
  }

  requireNotInGameOnAnotherSession(userSessionRegistry: UserSessionRegistry) {
    // we don't want them loading the same saved character into multiple active games,
    // so we'll prohibit simultaneous progression games per user
    const userSessions = userSessionRegistry.getExpectedUserSessions(this.username);
    for (const otherSession of userSessions) {
      if (otherSession.isInGame()) {
        throw new Error(ERROR_MESSAGES.LOBBY.USER_IN_GAME);
      }
    }
  }
}
