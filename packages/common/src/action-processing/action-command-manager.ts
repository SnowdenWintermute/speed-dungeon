import { ActionCommand } from "./action-command";

export class ActionCommandManager {
  queue: ActionCommand[] = [];
  currentlyProcessing: null | ActionCommand = null;
  constructor() {}

  enqueueNewCommands(commands: ActionCommand[]) {
    const queueWasPreviouslyEmpty = this.queue.length === 0;
    this.queue.push(...commands);
    console.log("enqueued commands: ", commands);
    if (commands[0]) console.log("first command: ", JSON.stringify(commands[0].payload));
    console.log("new queue: ", this.queue);

    if (this.currentlyProcessing === null && queueWasPreviouslyEmpty) this.processNextCommand();
  }

  processNextCommand() {
    console.log("looking at queue: ", this.queue);
    const nextCommand = this.queue.shift();
    console.log("next command processing: ", nextCommand);

    if (nextCommand === undefined) return (this.currentlyProcessing = null);
    this.currentlyProcessing = nextCommand;
    const maybeError = nextCommand.execute();
    if (maybeError instanceof Error) return console.error(maybeError);
  }
}
