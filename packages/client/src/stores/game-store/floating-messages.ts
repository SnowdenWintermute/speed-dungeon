import { GameState, useGameStore } from ".";
import { BabylonControlledCombatantData } from "./babylon-controlled-combatant-data";

export enum FloatingMessageTextColor {
  Damage,
  Healing,
  ManaGained,
}

export enum FloatingMessageElementType {
  Text,
  Image,
}

export type FloatingMessageTextElement = {
  type: FloatingMessageElementType.Text;
  text: string | number;
  classNames?: string;
  styles?: { [key: string]: number | string };
};

export type FloatingMessageImageElement = {
  type: FloatingMessageElementType.Image;
  src: string;
  classNames: string;
  styles: { [key: string]: number | string };
};

export type FloatingMessageElement = FloatingMessageImageElement | FloatingMessageTextElement;

export class FloatingMessage {
  constructor(
    public id: string,
    public elements: FloatingMessageElement[],
    public displayTime: number = 2000
  ) {}
}

export function getTailwindClassFromFloatingTextColor(color: FloatingMessageTextColor) {
  switch (color) {
    case FloatingMessageTextColor.Damage:
      return "text-zinc-300";
    case FloatingMessageTextColor.Healing:
      return "text-green-600";
    case FloatingMessageTextColor.ManaGained:
      return "text-blue-600";
  }
}

export function startFloatingMessage(
  combatantId: string,
  elements: FloatingMessageElement[],
  displayTime: number
) {
  let id: string;
  useGameStore.getState().mutateState((gameState) => {
    id = gameState.lastDebugMessageId.toString();
    let newMessage = new FloatingMessage(id, elements, displayTime);

    if (!gameState.babylonControlledCombatantDOMData[combatantId]) {
      gameState.babylonControlledCombatantDOMData[combatantId] =
        new BabylonControlledCombatantData();
    }

    gameState.babylonControlledCombatantDOMData[combatantId]?.floatingMessages.push(newMessage);
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
  gameState.babylonControlledCombatantDOMData[combatantId]?.floatingMessages.forEach(
    (message, index) => {
      if (messageId === message.id) {
        indicesToRemove.push(index);
      }
    }
  );
  indicesToRemove.forEach((index) => {
    gameState.babylonControlledCombatantDOMData[combatantId]?.floatingMessages.splice(index, 1);
  });
}