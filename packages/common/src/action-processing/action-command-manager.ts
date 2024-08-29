import { ActionCommand } from "./action-command";

export class ActionCommandManager {
  queue: ActionCommand[] = [];
  currentlyProcessing: null | ActionCommand = null;
  constructor() {}

  enqueueNewCommands(commands: ActionCommand[]) {
    const queueWasPreviouslyEmpty = this.queue.length === 0;
    this.queue.push(...commands);
    if (this.currentlyProcessing === null && queueWasPreviouslyEmpty) this.processNextCommand();
  }

  processNextCommand() {
    const nextCommand = this.queue.shift();
    if (nextCommand === undefined) return;
    this.currentlyProcessing = nextCommand;
    const maybeError = nextCommand.execute();
    if (maybeError instanceof Error) return console.error(maybeError);
  }
}
