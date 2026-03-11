import { makeAutoObservable } from "mobx";
import { GameLogMessage } from "./game-log-messages";

export class EventLogStore {
  private messages: GameLogMessage[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  clearGameLog() {
    this.messages = [];
  }

  postGameLogMessage(message: GameLogMessage) {
    this.messages.push(message);
  }

  getGameLogMessages() {
    return this.messages;
  }
}
