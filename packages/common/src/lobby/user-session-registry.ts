import { ConnectionId, Username } from "../index.js";
import { UserSession } from "./user-session.js";

export class UserSessionRegistry {
  // when we want to get a connection from a user name
  // we can use their connectionIds to look up which LobbyUser (associated browser tab) is
  // in some game or channel
  // @TODO - handle in register/unregister
  private connectionIdsByUsername: Map<Username, Set<ConnectionId>> = new Map();
  // when getting a message from some connection id, find out which user it is coming from
  private userSessions: Map<ConnectionId, UserSession> = new Map();

  register(session: UserSession) {
    const alreadyExists = this.userSessions.has(session.connectionId);
    if (alreadyExists) {
      throw new Error("Session already exists with the provided connectionId");
    }

    this.userSessions.set(session.connectionId, session);
  }

  unregister(connectionId: ConnectionId) {
    const doesNotExist = this.userSessions.has(connectionId);
    if (doesNotExist) {
      throw new Error("Tried to unregister a session that didn't exist");
    }
    this.userSessions.delete(connectionId);
  }

  getConnectionsSubscribedToChannel(channelName: string): ConnectionId[] {
    const result: ConnectionId[] = [];

    for (const [connectionId, session] of this.userSessions.entries()) {
      if (session.channelsSubscribedTo.includes(channelName)) {
        result.push(connectionId as ConnectionId);
      }
    }

    return result;
  }
}
