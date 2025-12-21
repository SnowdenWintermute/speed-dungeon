import { ERROR_MESSAGES } from "../errors/index.js";
import {
  ActionValidity,
  ChannelName,
  ConnectionId,
  IdentityProviderId,
  SpeedDungeonGame,
  SpeedDungeonProfile,
  Username,
} from "../index.js";

export interface AuthorizedSession {
  session: UserSession;
  userId: IdentityProviderId;
  profile: SpeedDungeonProfile;
}

export class UserSession {
  public currentGameName: null | string = null;
  public currentPartyName: null | string = null;
  private channelsSubscribedTo: Set<ChannelName> = new Set();

  constructor(
    public readonly username: Username,
    /** either a socket.id or a locally generated UUID on client */
    public readonly connectionId: ConnectionId,
    /** snowauth user id */
    public readonly userId: null | IdentityProviderId
  ) {}

  isSubscribedToChannel(channelName: ChannelName) {
    return this.channelsSubscribedTo.has(channelName);
  }

  canJoinNewGame(isRanked?: boolean): ActionValidity {
    if (this.currentGameName !== null) {
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
}
