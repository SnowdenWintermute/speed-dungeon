import { makeAutoObservable } from "mobx";
import { runIfInBrowser } from "../utils/index.js";
import { ActionCommand } from "./action-command.js";
import { ActionCommandPayload } from "./index.js";

export class ActionCommandQueue {
  commands: ActionCommand[] = [];
  isProcessing: boolean = false;
  timeLastCommandStarted: number = Date.now();

  constructor() {
    runIfInBrowser(() => makeAutoObservable(this, {}, { autoBind: true }));
  }

  enqueueNewCommands(commands: ActionCommand[]) {
    this.commands.push(...commands);
  }

  async processCommands(): Promise<Error | ActionCommandPayload[]> {
    if (this.isProcessing) return [];
    const errors: Error[] = [];
    const newPayloads: ActionCommandPayload[] = [];
    this.isProcessing = true;
    let currentCommand = this.commands.shift();
    while (currentCommand) {
      this.timeLastCommandStarted = Date.now();
      const newPayloadOptionResult = await currentCommand.execute();
      if (newPayloadOptionResult instanceof Error) {
        console.error(newPayloadOptionResult);
        errors.push(newPayloadOptionResult);
      } else if (newPayloadOptionResult) {
        newPayloads.push(...newPayloadOptionResult);
      }
      currentCommand = this.commands.shift();
    }
    this.isProcessing = false;

    if (errors[0]) return errors[0];
    else return newPayloads;
  }
}
