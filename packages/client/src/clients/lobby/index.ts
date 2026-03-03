import {
  BrowserWebSocketConnectionEndpoint,
  ConnectionId,
  GameStateUpdate,
  invariant,
} from "@speed-dungeon/common";
import { createLobbyUpdateHandlers } from "./lobby-update-handlers";
import { BaseClient } from "../base-client";
import { ConnectionStatus } from "@/mobx-stores/connection-status";

export class LobbyClient extends BaseClient {
  private updateHandlers = createLobbyUpdateHandlers(
    this.appStore,
    this.gameWorldView,
    this.characterAutoFocusManager,
    this.connectionEndpoint
  );

  protected handleMessage(message: GameStateUpdate) {
    const handlerOption = this.updateHandlers[message.type];
    invariant(handlerOption !== undefined, `Unhandled update type: ${JSON.stringify(message)}`);
    handlerOption(message.data as never);
  }

  resetConnection() {
    console.info("reconnecting to lobby");
    this.connectionEndpoint.close();
    this.appStore.connectionStatusStore.connectionStatus = ConnectionStatus.Initializing;

    const remoteLobbyServerAddress = process.env.NEXT_PUBLIC_WS_SERVER_URL;
    // TODO - polymorphic runtime mode based reconnection
    const ws = new WebSocket(remoteLobbyServerAddress || "");
    const connectionEndpoint = new BrowserWebSocketConnectionEndpoint(ws, "" as ConnectionId);
    try {
      this.setEndpoint(connectionEndpoint);
    } catch {
      return;
    }
  }
}
