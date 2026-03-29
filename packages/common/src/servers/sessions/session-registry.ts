import { ChannelName, ConnectionId } from "../../aliases.js";

export abstract class ConnectionSession {
  private channelsSubscribedTo = new Set<ChannelName>();
  private _lastIntentHandledId = 0;

  constructor(public readonly connectionId: ConnectionId) {}

  isSubscribedToChannel(channelName: ChannelName) {
    return this.channelsSubscribedTo.has(channelName);
  }

  subscribeToChannel(channelName: ChannelName) {
    if (this.channelsSubscribedTo.has(channelName)) {
      throw new Error("Tried to subscribe to a channel but was already subscribed to it");
    }
    this.channelsSubscribedTo.add(channelName);
  }

  unsubscribeFromChannel(channelName: ChannelName) {
    if (!this.channelsSubscribedTo.has(channelName)) {
      throw new Error("Tried to unsubscribe to a channel but was not subscribed to it");
    }
    this.channelsSubscribedTo.delete(channelName);
  }

  get lastIntentHandledId() {
    return this._lastIntentHandledId;
  }

  incrementLastIntentHandledId() {
    this._lastIntentHandledId += 1;
  }
}

export abstract class SessionRegistry<T extends ConnectionSession> {
  protected sessions = new Map<ConnectionId, T>();

  abstract onRegister?(session: T): void;
  abstract onUnregister?(session: T): void;

  register(session: T) {
    const alreadyExists = this.sessions.has(session.connectionId);
    if (alreadyExists) {
      throw new Error("Session already exists with the provided connectionId");
    }

    this.sessions.set(session.connectionId, session);

    this.onRegister?.(session);
  }

  unregister(connectionId: ConnectionId) {
    const session = this.sessions.get(connectionId);

    if (session === undefined) {
      throw new Error("Tried to unregister a session that didn't exist");
    }

    this.sessions.delete(connectionId);
    this.onUnregister?.(session);
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
