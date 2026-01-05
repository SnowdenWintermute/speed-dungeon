import { ChannelName, ConnectionId } from "../../index.js";

export interface ConnectionSession {
  connectionId: ConnectionId;
  isSubscribedToChannel: (channelName: ChannelName) => boolean;
}

export abstract class SessionRegistry<T extends ConnectionSession> {
  protected sessions = new Map<ConnectionId, T>();

  abstract onRegister(session: T): void;
  abstract onUnregister(session: T): void;

  register(session: T) {
    const alreadyExists = this.sessions.has(session.connectionId);
    if (alreadyExists) {
      throw new Error("Session already exists with the provided connectionId");
    }

    this.sessions.set(session.connectionId, session);

    this.onRegister(session);
  }

  unregister(connectionId: ConnectionId) {
    const session = this.sessions.get(connectionId);

    if (session === undefined) {
      throw new Error("Tried to unregister a session that didn't exist");
    }

    this.sessions.delete(connectionId);
    this.onUnregister(session);
  }

  /** Returns all connectionIds whose sessions are currently subscribed
   * to the given channel. Multiple entries may belong to the same user.*/
  in(channelName: ChannelName, options?: { excludedIds: [ConnectionId] }): ConnectionId[] {
    const excludedIds: ConnectionId[] = [];
    if (options?.excludedIds) {
      excludedIds.push(...options.excludedIds);
    }

    return Array.from(this.sessions.entries())
      .filter(([_connectionId, session]) => session.isSubscribedToChannel(channelName))
      .filter(([connectionId, _session]) => !excludedIds.includes(connectionId))
      .map(([connectionId, _session]) => connectionId);
  }

  public getExpectedSession(connectionId: ConnectionId) {
    const userSessionOption = this.sessions.get(connectionId);
    if (userSessionOption === undefined) {
      throw new Error(`Expected session not found by connection id: ${connectionId}`);
    } else {
      return userSessionOption;
    }
  }
}
