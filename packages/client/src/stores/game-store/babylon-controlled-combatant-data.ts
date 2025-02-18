import { immerable } from "immer";
import { GameState, useGameStore } from ".";
import { FloatingMessage } from "./floating-messages";

export class BabylonControlledCombatantData {
  [immerable] = true;
  debugMessages: CombatantModelDebugMessage[] = [];
  debugHtml: string = "";
  floatingMessages: FloatingMessage[] = [];
  constructor() {}
}

export class CombatantModelDebugMessage {
  constructor(
    public text: string,
    public id: string,
    public displayTime: number
  ) {}
}

export function setDebugMessage(combatantId: string, message: string, displayTime: number) {
  let id: string;
  useGameStore.getState().mutateState((gameState) => {
    id = gameState.lastDebugMessageId.toString();
    let newMessage = new CombatantModelDebugMessage(message, id, displayTime);
    if (!gameState.babylonControlledCombatantDOMData[combatantId]) {
      gameState.babylonControlledCombatantDOMData[combatantId] =
        new BabylonControlledCombatantData();
    }

    gameState.babylonControlledCombatantDOMData[combatantId]?.debugMessages.push(newMessage);
    gameState.lastDebugMessageId += 1;
  });
  setTimeout(() => {
    useGameStore.getState().mutateState((gameState) => {
      removeDebugMessage(gameState, combatantId, id);
    });
  }, displayTime);
}

export function removeDebugMessage(gameState: GameState, combatantId: string, messageId: string) {
  const indicesToRemove: number[] = [];
  gameState.babylonControlledCombatantDOMData[combatantId]?.debugMessages.forEach(
    (message, index) => {
      if (messageId === message.id) {
        indicesToRemove.push(index);
      }
    }
  );
  indicesToRemove.forEach((index) => {
    gameState.babylonControlledCombatantDOMData[combatantId]?.debugMessages.splice(index, 1);
  });
}
