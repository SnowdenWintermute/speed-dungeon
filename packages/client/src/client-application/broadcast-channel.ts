import { ClientSingleton } from "./clients/singleton";

export enum TabMessageType {
  ReconnectSocket,
  RefetchAuthSession,
}

export interface TabMessage {
  type: TabMessageType;
}

export class BroadcastChannelMananger {
  static CHANNEL_NAME = "speed dungeon broadcast channel";
  private broadcastChannel = new BroadcastChannel(BroadcastChannelMananger.CHANNEL_NAME);
  readonly sessionFetcher: {
    fromZustand: null | (() => Promise<void>);
  } = { fromZustand: null };

  constructor(lobbyClientRef: ClientSingleton) {
    this.broadcastChannel.onmessage = (message: any) => {
      if (message.data.type === TabMessageType.ReconnectSocket) {
        lobbyClientRef.get().resetConnection();
      }
      if (message.data.type === TabMessageType.RefetchAuthSession) {
        if (this.sessionFetcher.fromZustand) this.sessionFetcher.fromZustand();
      }
    };
  }
}
