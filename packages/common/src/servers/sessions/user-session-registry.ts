import { ChannelName, ConnectionId, GameName, Username } from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { UserId } from "./user-ids.js";
import { UserSession } from "./user-session.js";

export class UserSessionRegistry {
  private connectionIdsByUserId = new Map<UserId, ConnectionId>();
  private sessionsByConnectionId = new Map<ConnectionId, UserSession>();

  register(session: UserSession) {
    const alreadyExists = this.sessionsByConnectionId.has(session.connectionId);
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

  requireSession(connectionId: ConnectionId) {
    const userSessionOption = this.sessionsByConnectionId.get(connectionId);
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

  getAllSessionsInGame(game: SpeedDungeonGame) {
    const result: UserSession[] = [];
    for (const [username, _player] of game.players) {
      const session = this.requireSessionInGameByUsername(username, game.name);
      result.push(session);
    }
    return result;
  }

  requireSessionInGameByUsername(username: Username, gameName: GameName) {
    const existingSession = this.getSessionByUsername(username);
    if (existingSession?.currentGameName !== gameName) {
      throw new Error("expected to have a user session to match the player in game");
    }
    return existingSession;
  }
}
