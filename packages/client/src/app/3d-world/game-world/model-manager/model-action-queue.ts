import { useGameStore } from "@/stores/game-store";
import { ModelManager } from ".";
import { setAlert } from "@/app/components/alerts";
import { ModelAction } from "./model-actions";

export class ModelActionQueue {
  isProcessing: boolean = false;
  messages: ModelAction[] = [];

  constructor(public modelManager: ModelManager) {}

  enqueueMessage(message: ModelAction) {
    this.messages.push(message);
  }

  async processMessages() {
    console.log("starting to process messages");
    this.isProcessing = true;

    let currentAction = this.messages.shift();
    while (currentAction) {
      const handler = this.modelManager.modelActionHandlers[currentAction.type];
      const maybeError = await handler(currentAction);
      console.log("handler resolved");

      if (maybeError instanceof Error) setAlert(maybeError);
      currentAction = this.messages.shift();
      console.log("processed action, next: ", currentAction);
    }

    console.log("no longer processing");
    this.isProcessing = false;

    useGameStore.getState().mutateState((state) => {
      state.combatantModelsAwaitingSpawn = false;
    });
  }
}
