import { ChannelName, ConnectionId, GameId, Username } from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { invariant } from "../../utils/index.js";
import { UserId } from "./user-ids.js";
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
      const session = this.requireSessionInGameByUsername(username, game.id);
      result.push(session);
    }
    return result;
  }

  requireSessionInGameByUsername(username: Username, gameId: GameId) {
    const existingSession = this.getSessionByUsername(username);
    if (existingSession?.currentGameId !== gameId) {
      throw new Error("expected to have a user session to match the player in game");
    }
    return existingSession;
  }

  static requireSessionInListByUsername(username: Username, sessions: UserSession[]) {
    const session = sessions.find((session) => session.username === username);
    invariant(session !== undefined, "Expected user session with matching username");
    return session;
  }
}
