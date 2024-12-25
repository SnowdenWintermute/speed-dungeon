import { EntityId } from "../primatives/index.js";
import { ActionCommand } from "./action-command.js";
import { ACTION_COMMAND_TYPE_STRINGS } from "./index.js";

export class ActionCommandManager {
  queue: ActionCommand[] = [];
  currentlyProcessing: null | ActionCommand = null;
  entitiesPerformingActions: EntityId[] = [];
  timeLastCommandStarted: number = Date.now();

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
      console.log("action command queue emptied");
      return;
    }

    this.currentlyProcessing = nextCommand;
    console.log(
      "executing action command",
      ACTION_COMMAND_TYPE_STRINGS[this.currentlyProcessing.payload.type],
      "time since last command processed:",
      Date.now() - this.timeLastCommandStarted
    );
    this.timeLastCommandStarted = Date.now();
    const maybeError = nextCommand.execute();
    if (maybeError instanceof Error) return console.error(maybeError);
  }
}
