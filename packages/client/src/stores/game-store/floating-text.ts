import { GameState, useGameStore } from ".";
import { BabylonControlledCombatantData } from "./babylon-controlled-combatant-data";

export enum FloatingTextColor {
  Damage,
  Healing,
  ManaGained,
}

export class FloatingText {
  constructor(
    public id: string,
    public text: string,
    public color: FloatingTextColor,
    public isCrit: boolean,
    public displayTime: number = 2000
  ) {}
}

export function getTailwindClassFromFloatingTextColor(color: FloatingTextColor) {
  switch (color) {
    case FloatingTextColor.Damage:
      return "text-zinc-300";
    case FloatingTextColor.Healing:
      return "text-green-600";
    case FloatingTextColor.ManaGained:
      return "text-blue-600";
  }
}

export function startFloatingText(
  combatantId: string,
  message: string,
  color: FloatingTextColor,
  isCrit: boolean,
  displayTime: number
) {
  let id: string;
  useGameStore.getState().mutateState((gameState) => {
    id = gameState.lastDebugMessageId.toString();
    let newMessage = new FloatingText(id, message, color, isCrit, displayTime);

    if (!gameState.babylonControlledCombatantDOMData[combatantId]) {
      gameState.babylonControlledCombatantDOMData[combatantId] =
        new BabylonControlledCombatantData();
    }

    gameState.babylonControlledCombatantDOMData[combatantId]?.floatingText.push(newMessage);
    gameState.lastDebugMessageId += 1;
  });

  setTimeout(() => {
    useGameStore.getState().mutateState((gameState) => {
      removeFloatingText(gameState, combatantId, id);
    });
  }, displayTime);
}

// @todo - abstract this to work with both floatingText and debugMessages
export function removeFloatingText(gameState: GameState, combatantId: string, messageId: string) {
  const indicesToRemove: number[] = [];
  gameState.babylonControlledCombatantDOMData[combatantId]?.floatingText.forEach(
    (message, index) => {
      if (messageId === message.id) {
        indicesToRemove.push(index);
      }
    }
  );
  indicesToRemove.forEach((index) => {
    gameState.babylonControlledCombatantDOMData[combatantId]?.floatingText.splice(index, 1);
  });
}
