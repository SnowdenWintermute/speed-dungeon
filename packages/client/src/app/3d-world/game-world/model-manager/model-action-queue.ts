import { ModelManager } from ".";
import { setAlert } from "@/app/components/alerts";
import { ModelAction } from "./model-actions";
import { useGameStore } from "@/stores/game-store";
import { InputLock } from "@speed-dungeon/common";
import getCurrentParty from "@/utils/getCurrentParty";

export class ModelActionQueue {
  isProcessing: boolean = false;
  messages: ModelAction[] = [];

  constructor(public modelManager: ModelManager) {}

  enqueueMessage(message: ModelAction) {
    this.messages.push(message);
    // messages will be processed in game loop
  }

  async processMessages() {
    if (this.isProcessing) return console.log("already processing");
    this.isProcessing = true;

    let currentAction = this.messages.shift();
    while (currentAction) {
      // console.log(MODEL_ACTION_TYPE_STRINGS[currentAction.type]);
      const handler = this.modelManager.modelActionHandlers[currentAction.type];
      const maybeError = await handler(currentAction);

      if (maybeError instanceof Error) setAlert(maybeError);
      currentAction = this.messages.shift();
    }

    this.isProcessing = false;
  }
}
