import { GameStateUpdate, invariant } from "@speed-dungeon/common";
import { BaseClient } from "../base";
import { createGameUpdateHandlers } from "./update-handlers";
import { setAlert } from "@/app/components/alerts";

export class GameClient extends BaseClient {
  private updateHandlers = createGameUpdateHandlers(this.clientApplication);

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

  resetConnection(): void {
    //
  }
}
