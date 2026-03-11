import { EntityId, SequentialIdGenerator } from "@speed-dungeon/common";
import { FloatingMessage, FloatingMessageElement } from "./floating-messages";

export class FloatingMessagesStore {
  private messageIdGenerator = new SequentialIdGenerator();
  private floatingMessages = new Map<EntityId, FloatingMessage[]>();

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
    const newMessage = new FloatingMessage(id, elements, displayTime);

    const messagesOption = this.floatingMessages.get(entityId);

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
