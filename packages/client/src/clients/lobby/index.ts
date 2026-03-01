import {
  BrowserWebSocketConnectionEndpoint,
  ConnectionId,
  GameStateUpdate,
  invariant,
} from "@speed-dungeon/common";
import { createLobbyUpdateHandlers } from "./lobby-update-handlers";
import { BaseClient } from "../base-client";

export class LobbyClient extends BaseClient {
  private updateHandlers = createLobbyUpdateHandlers(
    this.appStore,
    this.gameWorldView,
    this.characterAutoFocusManager,
    this.connectionEndpoint
  );

  protected handleMessage(message: GameStateUpdate) {
    console.log("handling mesage:", message, JSON.stringify(message));
    const handlerOption = this.updateHandlers[message.type];
    console.log("handlerOption:", handlerOption);
    invariant(handlerOption !== undefined, `Unhandled update type: ${JSON.stringify(message)}`);
    handlerOption(message.data as never);
    console.log("handled");
  }

  resetConnection() {
    console.info("reconnecting to lobby");
    this.connectionEndpoint.close();
    const remoteLobbyServerAddress = process.env.NEXT_PUBLIC_WS_SERVER_URL;

    // online
    const ws = new WebSocket(remoteLobbyServerAddress || "");
    const connectionEndpoint = new BrowserWebSocketConnectionEndpoint(ws, "" as ConnectionId);
    try {
      this.setEndpoint(connectionEndpoint);
    } catch {
      return;
    }
  }
}
