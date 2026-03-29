import { MagicalElement, KineticDamageType } from "@speed-dungeon/common";

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

export interface FloatingMessageTextElement {
  type: FloatingMessageElementType.Text;
  text: string | number;
  classNames?: { mainText: string; shadowText: string };
}

export enum FloatingMessageIconType {
  KineticDamage,
  MagicalElement,
}

export interface FloatingMessageKineticDamageTypeIcon {
  type: FloatingMessageIconType.KineticDamage;
  damageType: KineticDamageType;
}
export interface FloatingMessageMagicalElementIcon {
  type: FloatingMessageIconType.MagicalElement;
  element: MagicalElement;
}

export type FloatingMessageIconData =
  | FloatingMessageKineticDamageTypeIcon
  | FloatingMessageMagicalElementIcon;

export interface FloatingMessageIconElement {
  type: FloatingMessageElementType.Image;
  iconData: FloatingMessageIconData;
  classNames?: string;
}

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
