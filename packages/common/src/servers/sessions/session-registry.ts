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
