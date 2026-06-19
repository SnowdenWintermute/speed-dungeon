import { ChannelName, ConnectionId, GameId, IdentityProviderId, Username } from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { invariant } from "../../utils/index.js";
import { UserId, UserIdType } from "./user-ids.js";
import { UserSession } from "./user-session.js";

export class UserSessionRegistry {
  private connectionIdsByUserId = new Map<UserId, ConnectionId>();
  private sessionsByConnectionId = new Map<ConnectionId, UserSession>();

  register(session: UserSession) {
    const alreadyExists =
      this.sessionsByConnectionId.has(session.connectionId) ||
      this.connectionIdsByUserId.has(session.taggedUserId.id);
    if (alreadyExists) {
      throw new Error("Session already exists with the provided connectionId");
    }
    this.sessionsByConnectionId.set(session.connectionId, session);
    this.connectionIdsByUserId.set(session.taggedUserId.id, session.connectionId);
  }

  unregister(connectionId: ConnectionId) {
    const session = this.requireSession(connectionId);
    if (session === undefined) {
      throw new Error("Tried to unregister a session that didn't exist");
    }
    this.sessionsByConnectionId.delete(connectionId);
    this.connectionIdsByUserId.delete(session.taggedUserId.id);
  }

  /** Returns all connectionIds whose sessions are currently subscribed
   * to the given channel. Multiple entries may belong to the same user.*/
  in(channelName: ChannelName, options?: { excludedIds: [ConnectionId] }): ConnectionId[] {
    const excludedIds: ConnectionId[] = [];
    if (options?.excludedIds) {
      excludedIds.push(...options.excludedIds);
    }

    return Array.from(this.sessionsByConnectionId.entries())
      .filter(([_connectionId, session]) => session.isSubscribedToChannel(channelName))
      .filter(([connectionId, _session]) => !excludedIds.includes(connectionId))
      .map(([connectionId, _session]) => connectionId);
  }

  getSessionOption(connectionId: ConnectionId) {
    return this.sessionsByConnectionId.get(connectionId);
  }

  requireSession(connectionId: ConnectionId) {
    const userSessionOption = this.getSessionOption(connectionId);
    if (userSessionOption === undefined) {
      throw new Error(`Expected session not found by connection id: ${connectionId}`);
    } else {
      return userSessionOption;
    }
  }

  requireConnection(userId: UserId) {
    const option = this.connectionIdsByUserId.get(userId);
    if (!option) {
      throw new Error("Expected UserId to have an associated ConnectionId");
    }
    return option;
  }

  getSessionByUsername(username: Username) {
    for (const [_, session] of this.sessionsByConnectionId) {
      if (session.username === username) {
        return session;
      }
    }
  }

  userIsAlreadyConnected(userId: UserId): boolean {
    return this.connectionIdsByUserId.has(userId);
  }

  getSessionByUserId(userId: UserId): undefined | UserSession {
    const connectionId = this.connectionIdsByUserId.get(userId);
    if (!connectionId) return;
    return this.requireSession(connectionId);
  }

  getAllSessionsInGame(game: SpeedDungeonGame) {
    const result: UserSession[] = [];
    for (const [username, _player] of game.players) {
      if (_player.awaitingControllingUserConnection) {
        continue;
      }
      // it is possible a player may be in the game, but no session exists
      // for them in the case of a continued ironman run game setup
      const sessionOption = this.getSessionByUsername(username);
      if (sessionOption) {
        result.push(sessionOption);
      }
    }
    return result;
  }

  getGameUsernameToIdsMap(game: SpeedDungeonGame) {
    const sessionsInGame = this.getAllSessionsInGame(game);
    const usernamesToUserIds = new Map<Username, IdentityProviderId>();
    for (const session of sessionsInGame) {
      invariant(session.taggedUserId.type === UserIdType.Auth, "expected only auth users");
      usernamesToUserIds.set(session.username, session.taggedUserId.id);
    }

    return usernamesToUserIds;
  }

  static requireSessionInListByUsername(username: Username, sessions: UserSession[]) {
    const session = sessions.find((session) => session.username === username);
    invariant(session !== undefined, "Expected user session with matching username");
    return session;
  }
}
