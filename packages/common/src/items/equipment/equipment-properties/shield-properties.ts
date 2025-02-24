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

export const SHIELD_SIZE_DAMAGE_REDUCTION: Record<ShieldSize, number> = {
  [ShieldSize.Small]: 0.2,
  [ShieldSize.Medium]: 0.4,
  [ShieldSize.Large]: 0.5,
};

export const SHIELD_SIZE_BLOCK_RATE: Record<ShieldSize, number> = {
  [ShieldSize.Small]: 0.55,
  [ShieldSize.Medium]: 0.4,
  [ShieldSize.Large]: 0.35,
};
