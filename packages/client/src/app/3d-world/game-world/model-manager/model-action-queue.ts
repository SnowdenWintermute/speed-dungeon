import { ModelManager } from ".";
import { setAlert } from "@/app/components/alerts";
import { MODEL_ACTION_TYPE_STRINGS, ModelAction } from "./model-actions";

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
    console.log("starting to process messages");
    this.isProcessing = true;

    let currentAction = this.messages.shift();
    while (currentAction) {
      console.log(MODEL_ACTION_TYPE_STRINGS[currentAction.type]);
      const handler = this.modelManager.modelActionHandlers[currentAction.type];
      const maybeError = await handler(currentAction);
      console.log("handler resolved");

      if (maybeError instanceof Error) setAlert(maybeError);
      currentAction = this.messages.shift();
      console.log("processed action, next: ", currentAction);
    }

    console.log("no longer processing");
    this.isProcessing = false;
  }
}
