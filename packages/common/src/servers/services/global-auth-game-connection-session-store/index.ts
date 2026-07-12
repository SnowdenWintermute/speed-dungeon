import { GameId, GameServerName, GuestUserId, IdentityProviderId } from "../../../aliases.js";
import { GuestSessionReconnectionToken } from "../../game-server/reconnection/guest-session-reconnection-token.js";
import {
  GameSessionConnectionStatus,
  GlobalGameSession,
} from "../../sessions/global-auth-game-session.js";
import { TaggedUserId, UserIdType } from "../../sessions/user-ids.js";
import { UserSession } from "../../sessions/user-session.js";

export abstract class UserGlobalGameSessionStore {
  abstract registerSession(
    localUserSession: UserSession,
    gameServerName: GameServerName,
    connectionStatus: GameSessionConnectionStatus
  ): Promise<void>;
  abstract getSessionOption(taggedUserId: TaggedUserId): Promise<undefined | GlobalGameSession>;
  abstract hasExistingSession(taggedUserId: TaggedUserId): Promise<boolean>;
  abstract requireSession(taggedUserId: TaggedUserId): Promise<GlobalGameSession>;
  abstract updateSessionConnectionStatus(
    taggedUserId: TaggedUserId,
    value: GameSessionConnectionStatus
  ): Promise<void>;
  abstract updateGuestReconnectionToken(
    taggedUserId: TaggedUserId,
    value: null | GuestSessionReconnectionToken
  ): Promise<void>;

  abstract clearSession(taggedUserId: TaggedUserId): Promise<void>;
  abstract clearSessionsInGame(gameId: GameId): Promise<void>;
}

export class InMemoryGlobalGameSessionStore extends UserGlobalGameSessionStore {
  private _authSessions = new Map<IdentityProviderId, GlobalGameSession>();
  private _guestSessions = new Map<GuestUserId, GlobalGameSession>();

  async registerSession(
    localUserSession: UserSession,
    gameServerName: GameServerName,
    connectionStatus: GameSessionConnectionStatus
  ): Promise<void> {
    const { taggedUserId } = localUserSession;
    const sessionAlreadyExists = await this.hasExistingSession(taggedUserId);
    if (sessionAlreadyExists) {
      throw new Error(
        `Tried to register a new GlobalAuthGameSession but one already existed for user id ${taggedUserId}`
      );
    }
    const newGlobalSession = new GlobalGameSession(
      localUserSession,
      gameServerName,
      connectionStatus
    );

    switch (taggedUserId.type) {
      case UserIdType.Auth:
        this._authSessions.set(taggedUserId.id, newGlobalSession);
        break;
      case UserIdType.Guest:
        this._guestSessions.set(taggedUserId.id, newGlobalSession);
        break;
    }
  }

  async getSessionOption(taggedUserId: TaggedUserId): Promise<GlobalGameSession | undefined> {
    switch (taggedUserId.type) {
      case UserIdType.Auth:
        return this._authSessions.get(taggedUserId.id);
      case UserIdType.Guest:
        return this._guestSessions.get(taggedUserId.id);
    }
  }
  async hasExistingSession(taggedUserId: TaggedUserId): Promise<boolean> {
    const option = await this.getSessionOption(taggedUserId);
    return !!option;
  }
  async requireSession(taggedUserId: TaggedUserId): Promise<GlobalGameSession> {
    const expected = await this.getSessionOption(taggedUserId);
    if (!expected) {
      throw new Error("Expected GlobalAuthGameSession not found");
    }
    return expected;
  }
  async updateSessionConnectionStatus(
    taggedUserId: TaggedUserId,
    value: GameSessionConnectionStatus
  ): Promise<void> {
    const expected = await this.requireSession(taggedUserId);
    expected.connectionStatus = value;
  }
  async updateGuestReconnectionToken(
    taggedUserId: TaggedUserId,
    value: GuestSessionReconnectionToken | null
  ): Promise<void> {
    const expected = await this.requireSession(taggedUserId);
    expected.guestSessionReconnectionToken = value;
  }
  async clearSession(taggedUserId: TaggedUserId): Promise<void> {
    switch (taggedUserId.type) {
      case UserIdType.Auth:
        this._authSessions.delete(taggedUserId.id);
        break;
      case UserIdType.Guest:
        this._guestSessions.delete(taggedUserId.id);
        break;
    }
  }

  async clearSessionsInGame(gameId: GameId): Promise<void> {
    for (const [authId, session] of this._authSessions.entries()) {
      if (session.gameId === gameId) {
        this._authSessions.delete(authId);
      }
    }
    for (const [guestId, session] of this._guestSessions.entries()) {
      if (session.gameId === gameId) {
        this._guestSessions.delete(guestId);
      }
    }
  }
}
