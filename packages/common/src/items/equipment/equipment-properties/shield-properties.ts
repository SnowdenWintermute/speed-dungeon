import { ShieldBaseItemType } from "../equipment-types/index.js";

export interface ShieldProperties {
  baseItem: ShieldBaseItemType;
  size: ShieldSize;
  armorClass: number;
}

export enum ShieldSize {
  Small,
  Medium,
  Large,
}
