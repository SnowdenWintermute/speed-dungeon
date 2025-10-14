import { EntityId, SequentialIdGenerator } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";
import { BabylonControlledCombatantData } from "./babylon-controlled-ui";
import { FloatingMessage, FloatingMessageElement } from "./floating-messages";

export class GameWorldStore {
  private messageIdGenerator = new SequentialIdGenerator();
  private modelLoadingStates: Record<EntityId, boolean> = {};
  private babylonControlledCombatantDOMData: Record<EntityId, BabylonControlledCombatantData> = {};

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setModelLoading(entityId: EntityId) {
    this.modelLoadingStates[entityId] = true;
  }

  setModelIsLoaded(entityId: EntityId) {
    this.modelLoadingStates[entityId] = false;
  }

  clearModelLoadingState(entityId: EntityId) {
    delete this.modelLoadingStates[entityId];
  }

  modelIsLoading(entityId: EntityId) {
    const modelIsLoading = this.modelLoadingStates[entityId];
    if (modelIsLoading === undefined) return true;
    return this.modelLoadingStates[entityId];
  }

  getCombatantDebugDisplay(entityId: EntityId) {
    const combatantDataOption = this.babylonControlledCombatantDOMData[entityId];
    if (combatantDataOption === undefined) return "";
    return combatantDataOption.debugHtml;
  }

  getFloatingMessages(entityId: EntityId) {
    const combatantDataOption = this.babylonControlledCombatantDOMData[entityId];
    if (combatantDataOption === undefined) return [];
    console.log("isObservableArray:", Array.isArray(combatantDataOption.floatingMessages));
    return combatantDataOption.floatingMessages;
  }

  startFloatingMessage(
    combatantId: string,
    elements: FloatingMessageElement[],
    displayTime: number,
    onComplete?: () => void
  ) {
    const id = this.messageIdGenerator.getNextId();
    let newMessage = new FloatingMessage(id, elements, displayTime);

    let combatantDataOption = this.babylonControlledCombatantDOMData[combatantId];

    if (!combatantDataOption) {
      combatantDataOption = this.babylonControlledCombatantDOMData[combatantId] =
        new BabylonControlledCombatantData();
    }

    combatantDataOption.floatingMessages.push(newMessage);

    console.log(
      "started floating message:",
      JSON.stringify(elements),
      "floatingMessages:",
      combatantDataOption.floatingMessages
    );

    setTimeout(() => {
      this.removeFloatingMessage(combatantId, id);
      if (onComplete !== undefined) onComplete();
    }, displayTime);
  }

  removeFloatingMessage(combatantId: string, messageId: string) {
    const combatantMessagesOption = this.babylonControlledCombatantDOMData[combatantId];
    if (!combatantMessagesOption) {
      return console.error("no combatant floating message record found");
    }

    combatantMessagesOption.floatingMessages = combatantMessagesOption.floatingMessages.filter(
      (message) => messageId !== message.id
    );

    console.log("removed floating message, new messages now:", combatantMessagesOption);
  }
}
