import { EquipmentType } from "../equipment-types/index.js";
import { Shield } from "../equipment-types/shield.js";

export interface ShieldProperties {
  type: EquipmentType.Shield;
  baseItem: Shield;
  size: ShieldSize;
  armorClass: number;
}

export enum ShieldSize {
  Small,
  Medium,
  Large,
}
