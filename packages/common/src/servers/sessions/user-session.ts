import {
  ConnectionId,
  GameName,
  GuestSessionReconnectionToken,
  PartyName,
  Username,
} from "../../aliases.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { ActionValidity } from "../../primatives/index.js";
import { invariant } from "../../utils/index.js";
import { GameRegistry } from "../game-registry.js";
import {
  ReconnectionKey,
  ReconnectionKeyType,
} from "../services/disconnected-session-store/index.js";
import { SpeedDungeonProfileService } from "../services/profiles.js";
import { ConnectionSession } from "./session-registry.js";
import { AuthTaggedUserId, TaggedUserId, UserIdType } from "./user-ids.js";
import { UserSessionRegistry } from "./user-session-registry.js";

export enum UserSessionConnectionState {
  Connected,
  Disconnected,
}

export class UserSession extends ConnectionSession {
  public currentGameName: null | GameName = null;
  public currentPartyName: null | PartyName = null;
  private guestReconnectionToken: null | GuestSessionReconnectionToken = null;
  // in the case of two connections disconnecting at the same time we will synchronously
  // set each one to disconnected such that we won't have an async race between each
  // disconnection handler trying to send a user disconnected message to each other but they
  // both are no longer registered endpoints
  private _connectionState = UserSessionConnectionState.Connected;

  constructor(
    private _username: Username,
    /** either a socket.id or a locally generated UUID on client */
    public readonly connectionId: ConnectionId,
    public readonly taggedUserId: TaggedUserId,
    private readonly gameRegistry: GameRegistry
  ) {
    super(connectionId);
  }

  get username() {
    return this._username;
  }

  set username(username: Username) {
    this._username = username;
  }

  get connectionState() {
    return this._connectionState;
  }

  set connectionState(newState: UserSessionConnectionState) {
    this._connectionState = newState;
  }

  getExpectedCurrentGame() {
    if (this.currentGameName === null) {
      throw new Error(ERROR_MESSAGES.USER.NO_CURRENT_GAME);
    }
    return this.gameRegistry.requireGame(this.currentGameName);
  }

  isInGame() {
    return this.currentGameName !== null;
  }

  isAuth() {
    return this.taggedUserId.type === UserIdType.Auth;
  }

  isGuest() {
    return this.taggedUserId.type === UserIdType.Guest;
  }

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

    const userIsGuest = this.taggedUserId.type === UserIdType.Guest;
    if (isRanked && userIsGuest) {
      return new ActionValidity(false, ERROR_MESSAGES.AUTH.REQUIRED);
    }

    return new ActionValidity(true);
  }

  joinGame(game: SpeedDungeonGame) {
    this.currentGameName = game.name;
  }

  requireNotInGameOnAnotherSession(userSessionRegistry: UserSessionRegistry) {
    // we don't want them loading the same saved character into multiple active games,
    // so we'll prohibit simultaneous progression games per user
    const userSessions = userSessionRegistry.getExpectedUserSessions(this.taggedUserId.id);
    for (const otherSession of userSessions) {
      if (otherSession.isInGame()) {
        throw new Error(ERROR_MESSAGES.LOBBY.USER_IN_GAME);
      }
    }
  }

  requireAuthorized(): asserts this is { userId: AuthTaggedUserId } {
    if (this.taggedUserId.type !== UserIdType.Auth) {
      throw new Error(ERROR_MESSAGES.AUTH.REQUIRED);
    }
  }

  requireProfile(profileService: SpeedDungeonProfileService) {
    this.requireAuthorized();
    return profileService.fetchExpectedProfile(this.userId.id);
  }

  setGuestReconnectionToken(token: GuestSessionReconnectionToken) {
    invariant(this.isGuest());
    this.guestReconnectionToken = token;
  }

  getGuestReconnectionTokenOption() {
    return this.guestReconnectionToken;
  }

  getReconnectionKeyOption(): null | ReconnectionKey {
    switch (this.taggedUserId.type) {
      case UserIdType.Auth: {
        return {
          type: ReconnectionKeyType.Auth,
          userId: this.taggedUserId.id,
        };
      }
      case UserIdType.Guest: {
        const reconnectionTokenOption = this.getGuestReconnectionTokenOption();

        if (!reconnectionTokenOption) {
          return null;
        }

        return {
          type: ReconnectionKeyType.Guest,
          reconnectionToken: reconnectionTokenOption,
        };
      }
    }
  }

  requireReconnectionKey() {
    const key = this.getReconnectionKeyOption();
    invariant(key !== null);
    return key;
  }
}
