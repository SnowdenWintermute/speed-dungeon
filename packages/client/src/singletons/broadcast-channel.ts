import { lobbyClientSingleton } from "./lobby-client";

const channelName = "speed dungeon broadcast channel";
export const broadcastChannel = new BroadcastChannel(channelName);
export const sessionFetcher: {
  fromZustand: null | (() => Promise<void>);
} = { fromZustand: null };

export enum TabMessageType {
  ReconnectSocket,
  RefetchAuthSession,
}

export interface TabMessage {
  type: TabMessageType;
}

broadcastChannel.onmessage = (message: any) => {
  if (message.data.type === TabMessageType.ReconnectSocket) {
    lobbyClientSingleton.get().resetConnection();
  }
  if (message.data.type === TabMessageType.RefetchAuthSession) {
    if (sessionFetcher.fromZustand) sessionFetcher.fromZustand();
  }
};
