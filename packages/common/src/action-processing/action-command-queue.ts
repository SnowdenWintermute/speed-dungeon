import { makeAutoObservable } from "mobx";
import { ActionCommand } from "./action-command.js";
import { ActionCommandPayload } from "./index.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";

export class ActionCommandQueue implements Serializable, ReactiveNode {
  commands: ActionCommand[] = [];
  isProcessing: boolean = false;
  timeLastCommandStarted: number = Date.now();

  makeObservable(): void {
    makeAutoObservable(this);
  }

  toSerialized() {
    return {
      commands: this.commands.map((command) => command.toSerialized()),
      isProcessing: this.isProcessing,
      timeLastCommandStarted: this.timeLastCommandStarted,
    };
  }

  static fromSerialized(serialized: SerializedOf<ActionCommandQueue>) {
    const result = new ActionCommandQueue();
    result.commands = serialized.commands.map((v) => ActionCommand.fromSerialized(v));
    result.isProcessing = serialized.isProcessing;
    result.timeLastCommandStarted = serialized.timeLastCommandStarted;
    return result;
  }

  clear() {
    this.commands = [];
    this.isProcessing = false;
  }

  enqueueNewCommands(commands: ActionCommand[]) {
    this.commands.push(...commands);
  }

  async processCommands(): Promise<ActionCommandPayload[]> {
    if (this.isProcessing) {
      return [];
    }
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

    if (errors[0]) {
      throw errors[0];
    } else {
      return newPayloads;
    }
  }
}
