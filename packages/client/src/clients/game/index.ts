import { GameStateUpdate, invariant } from "@speed-dungeon/common";
import { BaseClient } from "../base-client";
import { createGameUpdateHandlers } from "./game-update-handlers";

export class GameClient extends BaseClient {
  private updateHandlers = createGameUpdateHandlers(
    this.appStore,
    this.gameWorldView,
    this.characterAutoFocusManager
  );

  protected handleMessage(message: GameStateUpdate) {
    console.log("handling game mesage:", message, JSON.stringify(message));
    const handlerOption = this.updateHandlers[message.type];
    invariant(handlerOption !== undefined, `Unhandled update type: ${JSON.stringify(message)}`);
    handlerOption(message.data as never);
  }
}
