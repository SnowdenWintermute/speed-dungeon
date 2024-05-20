import { EquipmentType } from "../equipment-types";
import { Shield } from "../equipment-types/shield";

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
