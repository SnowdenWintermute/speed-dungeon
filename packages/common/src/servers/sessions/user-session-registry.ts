import {
  ConnectionId,
  ERROR_MESSAGES,
  GameName,
  invariant,
  UserId,
  Username,
} from "../../index.js";
import { SessionRegistry } from "./session-registry.js";
import { UserSession } from "./user-session.js";

export class UserSessionRegistry extends SessionRegistry<UserSession> {
  // we have used this to ensure that when a user has a session in a progression game
  // they can not load that same saved character in another session
  private connectionIdsByUserId = new Map<UserId, Set<ConnectionId>>();

  onRegister(session: UserSession): void {
    this.addConnectionIdToUserId(session);
  }
  onUnregister(session: UserSession): void {
    this.removeConnectionIdFromUserId(session);
  }

  getConnectionIdsByUserId(userId: UserId) {
    return this.connectionIdsByUserId.get(userId) || new Set<ConnectionId>();
  }

  getSessionsByUsername(username: Username) {
    const result: UserSession[] = [];
    for (const [_connectionId, session] of Array.from(this.sessions)) {
      if (session.username === username) {
        result.push(session);
      }
    }
    return result;
  }

  userIsAlreadyConnected(userId: UserId): boolean {
    return this.connectionIdsByUserId.has(userId);
  }

  requireSingleConnection(userId: UserId) {
    const connectionIds = this.getConnectionIdsByUserId(userId);
    if (connectionIds.size !== 1) {
      throw new Error("Expected a single connection for this user id");
    }
    const connectionIdOption = Array.from(connectionIds.keys())[0];
    if (connectionIdOption === undefined) {
      throw new Error(ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED);
    }

    return connectionIdOption;
  }

  private getExpectedUserConnectionIds(userId: UserId) {
    const idsOption = this.getConnectionIdsByUserId(userId);
    if (idsOption.size === 0) {
      throw new Error(ERROR_MESSAGES.SERVER_GENERIC);
    } else {
      return Array.from(idsOption);
    }
  }

  getExpectedUserSessions(userId: UserId) {
    const connectionIds = this.getExpectedUserConnectionIds(userId);
    const result: UserSession[] = [];
    for (const id of connectionIds) {
      const expectedSession = this.sessions.get(id);
      if (expectedSession === undefined) {
        throw new Error("A connection id was registered without a matching session");
      }
      result.push(expectedSession);
    }

    return result;
  }

  private addConnectionIdToUserId(session: UserSession) {
    const connectionIdsForThisUser = this.connectionIdsByUserId.get(session.taggedUserId.id);
    if (connectionIdsForThisUser) {
      connectionIdsForThisUser.add(session.connectionId);
    } else {
      this.connectionIdsByUserId.set(session.taggedUserId.id, new Set([session.connectionId]));
    }
  }

  private removeConnectionIdFromUserId(session: UserSession) {
    const connectionIdsForThisUser = this.connectionIdsByUserId.get(session.taggedUserId.id);

    if (connectionIdsForThisUser === undefined) {
      throw new Error("Expected user id to have list of connections");
    }
    connectionIdsForThisUser.delete(session.connectionId);
    if (connectionIdsForThisUser.size === 0) {
      this.connectionIdsByUserId.delete(session.taggedUserId.id);
    }
  }

  public getExpectedSessionInGameByUsername(username: Username, gameName: GameName) {
    const existingSessionsByThisUserId = this.getSessionsByUsername(username);

    const sessionsInGame = existingSessionsByThisUserId.filter(
      (session) => session.currentGameName === gameName
    );

    const MAX_PERMITTED_USER_SESSIONS_IN_GAME = 1;
    invariant(sessionsInGame.length <= MAX_PERMITTED_USER_SESSIONS_IN_GAME);

    const expectedSessionForThisPlayer = sessionsInGame[0];
    if (expectedSessionForThisPlayer === undefined) {
      throw new Error("expected to have a user session to match the player in game");
    }

    return expectedSessionForThisPlayer;
  }
}
