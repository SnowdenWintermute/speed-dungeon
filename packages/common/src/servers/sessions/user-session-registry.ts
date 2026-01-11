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
  private connectionIdsByUsername = new Map<Username, Set<ConnectionId>>();

  onRegister(session: UserSession): void {
    this.addConnectionIdToUsername(session);
  }
  onUnregister(session: UserSession): void {
    this.removeConnectionIdFromUsername(session);
  }

  getConnectionIdsByUsername(username: Username) {
    return this.connectionIdsByUsername.get(username) || new Set<ConnectionId>();
  }

  userIsAlreadyConnected(userId: UserId): boolean {
    throw new Error("not implemented");
    // need to store users by user id so guest users can be checked for existing
    // connections since we provide user id in the GameServerSessionClaimTokens
    // and that links guests to their disconnection sessions and we can't let them
    // claim their disconnection session twice
  }

  requireSingleConnection(username: Username) {
    const connectionIds = this.getConnectionIdsByUsername(username);
    if (connectionIds.size !== 1) {
      throw new Error("Expected a single connection for this username");
    }
    const connectionIdOption = Array.from(connectionIds.keys())[0];
    if (connectionIdOption === undefined) {
      throw new Error(ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED);
    }

    return connectionIdOption;
  }

  private getExpectedUserConnectionIds(username: Username) {
    const idsOption = this.getConnectionIdsByUsername(username);
    if (idsOption.size === 0) {
      throw new Error(ERROR_MESSAGES.SERVER_GENERIC);
    } else {
      return Array.from(idsOption);
    }
  }

  getExpectedUserSessions(username: Username) {
    const connectionIds = this.getExpectedUserConnectionIds(username);
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

  private addConnectionIdToUsername(session: UserSession) {
    const connectionIdsForThisUser = this.connectionIdsByUsername.get(session.username);
    if (connectionIdsForThisUser) {
      connectionIdsForThisUser.add(session.connectionId);
    } else {
      this.connectionIdsByUsername.set(session.username, new Set([session.connectionId]));
    }
  }

  private removeConnectionIdFromUsername(session: UserSession) {
    const connectionIdsForThisUser = this.connectionIdsByUsername.get(session.username);

    if (connectionIdsForThisUser === undefined) {
      throw new Error("Expected username to have list of connections");
    }
    connectionIdsForThisUser.delete(session.connectionId);
    if (connectionIdsForThisUser.size === 0) {
      this.connectionIdsByUsername.delete(session.username);
    }
  }

  public getExpectedSessionInGame(username: Username, gameName: GameName) {
    const existingSessionsByThisPlayerUsername = this.getExpectedUserSessions(username);

    const sessionsInGame = existingSessionsByThisPlayerUsername.filter(
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
