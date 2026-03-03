import {
  BrowserWebSocketConnectionEndpoint,
  ConnectionId,
  GameStateUpdate,
  invariant,
} from "@speed-dungeon/common";
import { createLobbyUpdateHandlers } from "./lobby-update-handlers";
import { BaseClient } from "../base-client";
import { ConnectionStatus } from "@/mobx-stores/connection-status";
import { getApplicationRuntimeManager } from "@/singletons";

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
    getApplicationRuntimeManager().resetLobbyConnection();
  }
}
