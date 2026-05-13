import { makeAutoObservable } from "mobx";
import { GameLogMessage } from "./game-log-messages";

export class EventLogStore {
  private messages: GameLogMessage[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  clear() {
    this.messages = [];
  }

  postMessage(message: GameLogMessage) {
    this.messages.push(message);
  }

  getMessages() {
    return this.messages;
  }

  getLast() {
    return this.messages.at(-1);
  }
}
