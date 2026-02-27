import { GameStateUpdate, invariant } from "@speed-dungeon/common";
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
}
