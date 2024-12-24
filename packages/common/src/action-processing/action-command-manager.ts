import { EntityId } from "../primatives/index.js";
import { ActionCommand } from "./action-command.js";

export class ActionCommandManager {
  queue: ActionCommand[] = [];
  currentlyProcessing: null | ActionCommand = null;
  entitiesPerformingActions: EntityId[] = [];

  constructor() {}

  enqueueNewCommands(commands: ActionCommand[]) {
    const queueWasPreviouslyEmpty = this.queue.length === 0;
    this.queue.push(...commands);

    if (this.currentlyProcessing)
      console.log("action commands enqueued while queue still processing");
    if (!queueWasPreviouslyEmpty) console.log("action commands enqueued while queue not empty");
    if (this.currentlyProcessing === null && queueWasPreviouslyEmpty) this.processNextCommand();
  }

  processNextCommand() {
    const nextCommand = this.queue.shift();

    if (nextCommand === undefined) {
      this.currentlyProcessing = null;
      return;
    }

    this.currentlyProcessing = nextCommand;
    const maybeError = nextCommand.execute();
    if (maybeError instanceof Error) return console.error(maybeError);
  }
}
