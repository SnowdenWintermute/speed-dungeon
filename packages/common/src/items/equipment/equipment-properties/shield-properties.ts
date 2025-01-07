import { EquipmentType, ShieldBaseItemType } from "../equipment-types/index.js";

export interface ShieldProperties {
  taggedBaseEquipment: ShieldBaseItemType;
  equipmentType: EquipmentType.Shield;
  size: ShieldSize;
  armorClass: number;
}

export enum ShieldSize {
  Small,
  Medium,
  Large,
}
