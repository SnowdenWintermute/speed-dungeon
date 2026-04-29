import { LobbyClient } from "./clients/lobby";
import { ClientSingleton } from "./clients/singleton";
import { HttpRequestStore } from "./ui/http-requests";

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

  reconnectAllTabs() {
    this.broadcastChannel.postMessage({ type: TabMessageType.ReconnectSocket });
  }

  refetchAuthSessionInAllTabs() {
    this.broadcastChannel.postMessage({ type: TabMessageType.RefetchAuthSession });
  }

  constructor(lobbyClientRef: ClientSingleton<LobbyClient>, httpRequests: HttpRequestStore) {
    this.broadcastChannel.onmessage = (message: any) => {
      if (message.data.type === TabMessageType.ReconnectSocket) {
        try {
          lobbyClientRef.get().resetConnection();
        } catch {
          console.log("No lobby client to reset in this tab");
        }
      }
      if (message.data.type === TabMessageType.RefetchAuthSession) {
        httpRequests.fetchAuthSession();
      }
    };
  }
}
