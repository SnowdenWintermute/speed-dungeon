import { ActionCommand } from "./action-command.js";
import { ACTION_COMMAND_TYPE_STRINGS } from "./index.js";

export class ActionCommandQueue {
  commands: ActionCommand[] = [];
  isProcessing: boolean = false;
  timeLastCommandStarted: number = Date.now();

  constructor() {}

  enqueueNewCommands(commands: ActionCommand[]) {
    this.commands.push(...commands);
  }

  async processCommands() {
    if (this.isProcessing) {
      console.log("tried to start processing action command queue when it wasn't empty");
      return [];
    }
    const errors: Error[] = [];
    this.isProcessing = true;
    const currentCommand = this.commands.shift();
    while (currentCommand) {
      console.log(
        "executing action command",
        ACTION_COMMAND_TYPE_STRINGS[currentCommand.payload.type],
        "time since last command processed:",
        Date.now() - this.timeLastCommandStarted
      );
      this.timeLastCommandStarted = Date.now();
      const maybeError = await currentCommand.execute();
      if (maybeError instanceof Error) {
        console.error(maybeError);
        errors.push(maybeError);
      }
    }
    this.isProcessing = false;
    console.log("action command queue finished processing");

    return errors;
  }
}
