import { MagicalElement, KineticDamageType } from "@speed-dungeon/common";
import { GameState, useGameStore } from ".";
import { BabylonControlledCombatantData } from "./babylon-controlled-combatant-data";

export enum FloatingMessageTextColor {
  Damage,
  Healing,
  ManaGained,
  MagicalDamage,
  Parried,
}

export enum FloatingMessageElementType {
  Text,
  Image,
}

export type FloatingMessageTextElement = {
  type: FloatingMessageElementType.Text;
  text: string | number;
  classNames?: { mainText: string; shadowText: string };
};

export enum FloatingMessageIconType {
  KineticDamage,
  MagicalElement,
}

export type FloatingMessageKineticDamageTypeIcon = {
  type: FloatingMessageIconType.KineticDamage;
  damageType: KineticDamageType;
};
export type FloatingMessageMagicalElementIcon = {
  type: FloatingMessageIconType.MagicalElement;
  element: MagicalElement;
};

export type FloatingMessageIconData =
  | FloatingMessageKineticDamageTypeIcon
  | FloatingMessageMagicalElementIcon;

export type FloatingMessageIconElement = {
  type: FloatingMessageElementType.Image;
  iconData: FloatingMessageIconData;
  classNames?: string;
};

export type FloatingMessageElement = FloatingMessageIconElement | FloatingMessageTextElement;

export class FloatingMessage {
  constructor(
    public id: string,
    public elements: FloatingMessageElement[],
    public displayTime: number = 2000
  ) {}
}

export const FLOATING_TEXT_COLORS: Record<FloatingMessageTextColor, string> = {
  [FloatingMessageTextColor.Damage]: "text-zinc-300",
  [FloatingMessageTextColor.Healing]: "text-green-600",
  [FloatingMessageTextColor.ManaGained]: "text-blue-600",
  [FloatingMessageTextColor.MagicalDamage]: "text-sky-300",
  [FloatingMessageTextColor.Parried]: "text-zinc-300",
};

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
