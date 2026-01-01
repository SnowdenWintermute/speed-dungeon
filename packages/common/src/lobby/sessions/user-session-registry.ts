import { ChannelName, ConnectionId, ERROR_MESSAGES, Username } from "../../index.js";
import { UserSession } from "./user-session.js";

export class UserSessionRegistry {
  // we have used this to ensure that when a user has a session in a progression game
  // they can not load that same saved character in another session
  private connectionIdsByUsername = new Map<Username, Set<ConnectionId>>();
  private userSessions = new Map<ConnectionId, UserSession>();

  private getExpectedUserConnectionIds(username: Username) {
    const idsOption = this.connectionIdsByUsername.get(username);
    if (idsOption === undefined) {
      throw new Error(ERROR_MESSAGES.SERVER_GENERIC);
    } else {
      return Array.from(idsOption);
    }
  }

  getExpectedUserSessions(username: Username) {
    const connectionIds = this.getExpectedUserConnectionIds(username);
    const result: UserSession[] = [];
    for (const id of connectionIds) {
      const expectedSession = this.userSessions.get(id);
      if (expectedSession === undefined) {
        throw new Error("A connection id was registered without a matching session");
      }
      result.push(expectedSession);
    }

    return result;
  }

  register(session: UserSession) {
    const alreadyExists = this.userSessions.has(session.connectionId);
    if (alreadyExists) {
      throw new Error("Session already exists with the provided connectionId");
    }

    this.userSessions.set(session.connectionId, session);
    this.addConnectionIdToUsername(session);
  }

  private addConnectionIdToUsername(session: UserSession) {
    const connectionIdsForThisUser = this.connectionIdsByUsername.get(session.username);
    if (connectionIdsForThisUser) {
      connectionIdsForThisUser.add(session.connectionId);
    } else {
      this.connectionIdsByUsername.set(session.username, new Set([session.connectionId]));
    }
  }

  unregister(connectionId: ConnectionId) {
    const session = this.userSessions.get(connectionId);

    if (session === undefined) {
      throw new Error("Tried to unregister a session that didn't exist");
    }

    this.userSessions.delete(connectionId);
    this.removeConnectionIdFromUsername(session);
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

  /** Returns all connectionIds whose sessions are currently subscribed
   * to the given channel. Multiple entries may belong to the same user.*/
  in(channelName: ChannelName, options?: { excludedIds: [ConnectionId] }): ConnectionId[] {
    const excludedIds: ConnectionId[] = [];
    if (options?.excludedIds) {
      excludedIds.push(...options.excludedIds);
    }

    return Array.from(this.userSessions.entries())
      .filter(([connectionId, session]) => session.isSubscribedToChannel(channelName))
      .filter(([connectionId, session]) => !excludedIds.includes(connectionId))
      .map(([connectionId, session]) => connectionId);
  }

  public getExpectedSession(connectionId: ConnectionId) {
    const userSessionOption = this.userSessions.get(connectionId);
    if (userSessionOption === undefined) {
      throw new Error(`Expected session not found by connection id: ${connectionId}`);
    } else {
      return userSessionOption;
    }
  }
}
