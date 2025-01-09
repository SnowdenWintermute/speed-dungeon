import { BodyArmor } from "./body-armor.js";
import { HeadGear } from "./head-gear.js";
import { Amulet, Ring } from "./jewelry.js";
import { OneHandedMeleeWeapon } from "./one-handed-melee-weapon.js";
import { Shield } from "./shield.js";
import { TwoHandedMeleeWeapon } from "./two-handed-melee-weapon.js";
import { TwoHandedRangedWeapon } from "./two-handed-ranged-weapon.js";
export * from "./shield.js";
export * from "./two-handed-ranged-weapon.js";
export * from "./two-handed-melee-weapon.js";
export * from "./one-handed-melee-weapon.js";
export * from "./head-gear.js";
export * from "./jewelry.js";
export * from "./body-armor.js";

export enum EquipmentType {
  BodyArmor,
  HeadGear,
  Ring,
  Amulet,
  OneHandedMeleeWeapon,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
  Shield,
}

export type EquipmentBaseItemEnum =
  | typeof BodyArmor
  | typeof HeadGear
  | typeof OneHandedMeleeWeapon
  | typeof TwoHandedMeleeWeapon
  | typeof TwoHandedRangedWeapon
  | typeof Shield
  | typeof Ring
  | typeof Amulet;

export const BASE_ITEMS_BY_EQUIPMENT_TYPE: Record<EquipmentType, EquipmentBaseItemEnum> = {
  [EquipmentType.BodyArmor]: BodyArmor,
  [EquipmentType.HeadGear]: HeadGear,
  [EquipmentType.OneHandedMeleeWeapon]: OneHandedMeleeWeapon,
  [EquipmentType.TwoHandedMeleeWeapon]: TwoHandedMeleeWeapon,
  [EquipmentType.TwoHandedRangedWeapon]: TwoHandedRangedWeapon,
  [EquipmentType.Shield]: Shield,
  [EquipmentType.Ring]: Ring,
  [EquipmentType.Amulet]: Amulet,
};

export interface BodyArmorBaseItemType {
  equipmentType: EquipmentType.BodyArmor;
  baseItemType: BodyArmor;
}
export interface HeadGearBaseItemType {
  equipmentType: EquipmentType.HeadGear;
  baseItemType: HeadGear;
}
export interface OneHandedMeleeWeaponBaseItemType {
  equipmentType: EquipmentType.OneHandedMeleeWeapon;
  baseItemType: OneHandedMeleeWeapon;
}
export interface TwoHandedMeleeWeaponBaseItemType {
  equipmentType: EquipmentType.TwoHandedMeleeWeapon;
  baseItemType: TwoHandedMeleeWeapon;
}
export interface TwoHandedRangedWeaponBaseItemType {
  equipmentType: EquipmentType.TwoHandedRangedWeapon;
  baseItemType: TwoHandedRangedWeapon;
}
export interface ShieldBaseItemType {
  equipmentType: EquipmentType.Shield;
  baseItemType: Shield;
}
export interface RingBaseItemType {
  equipmentType: EquipmentType.Ring;
  baseItemType: Ring;
}
export interface AmuletBaseItemType {
  equipmentType: EquipmentType.Amulet;
  baseItemType: Amulet;
}

export type EquipmentBaseItemType =
  | Shield
  | Ring
  | Amulet
  | TwoHandedMeleeWeapon
  | TwoHandedRangedWeapon
  | OneHandedMeleeWeapon
  | BodyArmor
  | HeadGear;

export type EquipmentBaseItem =
  | BodyArmorBaseItemType
  | HeadGearBaseItemType
  | OneHandedMeleeWeaponBaseItemType
  | TwoHandedMeleeWeaponBaseItemType
  | TwoHandedRangedWeaponBaseItemType
  | ShieldBaseItemType
  | AmuletBaseItemType
  | RingBaseItemType;

export const EQUIPMENT_TYPE_STRINGS: Record<EquipmentType, string> = {
  [EquipmentType.BodyArmor]: "Body Armor",
  [EquipmentType.HeadGear]: "Head Gear",
  [EquipmentType.Ring]: "Ring",
  [EquipmentType.Amulet]: "Amulet",
  [EquipmentType.OneHandedMeleeWeapon]: "One Handed Melee Weapon",
  [EquipmentType.TwoHandedMeleeWeapon]: "Two Handed Melee Weapon",
  [EquipmentType.TwoHandedRangedWeapon]: "Two Handed Ranged Weapon",
  [EquipmentType.Shield]: "Shield",
};
