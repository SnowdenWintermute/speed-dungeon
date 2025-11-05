import { EntityId, SequentialIdGenerator } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";
import { FloatingMessage, FloatingMessageElement } from "./floating-messages";
import { GameLogMessage } from "./game-log-messages";

export class GameEventNotificationStore {
  private messageIdGenerator = new SequentialIdGenerator();
  private floatingMessages: Map<EntityId, FloatingMessage[]> = new Map();
  private gameLogMessages: GameLogMessage[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  clearGameLog() {
    this.gameLogMessages = [];
  }

  postGameLogMessage(message: GameLogMessage) {
    this.gameLogMessages.push(message);
  }

  getGameLogMessages() {
    return this.gameLogMessages;
  }

  getFloatingMessages(entityId: EntityId) {
    const messagesOption = this.floatingMessages.get(entityId);
    if (messagesOption === undefined) return [];
    return messagesOption;
  }

  startFloatingMessage(
    entityId: string,
    elements: FloatingMessageElement[],
    displayTime: number,
    onComplete?: () => void
  ) {
    const id = this.messageIdGenerator.getNextId();
    let newMessage = new FloatingMessage(id, elements, displayTime);

    let messagesOption = this.floatingMessages.get(entityId);

    if (messagesOption === undefined) {
      this.floatingMessages.set(entityId, [newMessage]);
    } else {
      messagesOption.push(newMessage);
    }

    setTimeout(() => {
      this.removeFloatingMessage(entityId, id);
      if (onComplete !== undefined) onComplete();
    }, displayTime);
  }

  removeFloatingMessage(entityId: string, messageId: string) {
    const messagesOption = this.floatingMessages.get(entityId);
    if (messagesOption === undefined) {
      return console.error("no combatant floating message record found");
    }
    const index = messagesOption.findIndex((message) => message.id === messageId);
    if (index !== -1) messagesOption.splice(index, 1);
  }
}
