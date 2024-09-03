import { formatActionCommandType } from ".";
import { ActionCommand } from "./action-command";

export class ActionCommandManager {
  queue: ActionCommand[] = [];
  currentlyProcessing: null | ActionCommand = null;
  constructor() {}

  enqueueNewCommands(commands: ActionCommand[]) {
    const queueWasPreviouslyEmpty = this.queue.length === 0;
    this.queue.push(...commands);
    // console.log(
    //   "new queue after got new commands: ",
    //   this.queue.map((command) => formatActionCommandType(command.payload.type))
    // );
    // console.log(
    //   "currentlyProcessing: ",
    //   this.currentlyProcessing
    //     ? formatActionCommandType(this.currentlyProcessing?.payload.type)
    //     : null
    // );
    if (this.currentlyProcessing === null && queueWasPreviouslyEmpty) this.processNextCommand();
  }

  processNextCommand() {
    const nextCommand = this.queue.shift();
    // console.log(
    //   "processing next command: ",
    //   nextCommand ? formatActionCommandType(nextCommand.payload.type) : ""
    // );
    if (nextCommand === undefined) return (this.currentlyProcessing = null);
    this.currentlyProcessing = nextCommand;
    const maybeError = nextCommand.execute();
    if (maybeError instanceof Error) return console.error(maybeError);
  }
}
