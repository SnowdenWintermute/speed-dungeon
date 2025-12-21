import { ChannelName, ConnectionId, Username } from "../index.js";
import { UserSession } from "./user-session.js";

export class UserSessionRegistry {
  // we have used this to ensure that when a user has a session in a progression game
  // they can not load that same saved character in another session
  private connectionIdsByUsername: Map<Username, Set<ConnectionId>> = new Map();
  private userSessions: Map<ConnectionId, UserSession> = new Map();

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
      throw new Error("Expected session not found");
    } else {
      return userSessionOption;
    }
  }
}
