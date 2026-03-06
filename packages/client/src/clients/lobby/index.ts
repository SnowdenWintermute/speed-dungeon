import { GameStateUpdate, invariant } from "@speed-dungeon/common";
import { createLobbyUpdateHandlers } from "./lobby-update-handlers";
import { BaseClient } from "../base-client";
import { getApplicationRuntimeManager } from "@/singletons";
import { setAlert } from "@/app/components/alerts";

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
    try {
      handlerOption(message.data as never);
    } catch (error) {
      setAlert(error as Error);
      console.trace(error);
    }
  }

  resetConnection() {
    console.info("reconnecting to lobby");
    getApplicationRuntimeManager().resetLobbyConnection();
  }
}
