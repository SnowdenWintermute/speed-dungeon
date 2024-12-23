import { useGameStore } from "@/stores/game-store";
import { ModelManager } from ".";
import { setAlert } from "@/app/components/alerts";
import { ModelAction } from "./model-actions";

export class ModelActionQueue {
  isProcessing: boolean = false;
  messages: ModelAction[] = [];

  constructor(public modelManager: ModelManager) {}

  async processMessages() {
    this.isProcessing = true;

    let currentAction = this.messages.shift();
    while (currentAction) {
      const maybeError = await this.modelManager.modelActionHandlers[currentAction.type](
        this.modelManager,
        currentAction
      );
      if (maybeError instanceof Error) setAlert(maybeError);
      currentAction = this.messages.shift();
    }

    this.isProcessing = false;

    useGameStore.getState().mutateState((state) => {
      state.combatantModelsAwaitingSpawn = false;
    });
  }
}
