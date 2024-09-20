import { BodyArmor } from "./body-armor.js";
import { HeadGear } from "./head-gear.js";
import { Jewelry } from "./jewelry.js";
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
  baseItemType: Jewelry.Ring;
}
export interface AmuletBaseItemType {
  equipmentType: EquipmentType.Amulet;
  baseItemType: Jewelry.Amulet;
}

export type EquipmentBaseItemType =
  | Shield
  | Jewelry
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

export function formatEquipmentType(equipmentType: EquipmentType) {
  switch (equipmentType) {
    case EquipmentType.BodyArmor:
      return "Body Armor";
    case EquipmentType.HeadGear:
      return "Head Gear";
    case EquipmentType.Ring:
      return "Ring";
    case EquipmentType.Amulet:
      return "Amulet";
    case EquipmentType.OneHandedMeleeWeapon:
      return "One Handed Melee Weapon";
    case EquipmentType.TwoHandedMeleeWeapon:
      return "Two Handed Melee Weapon";
    case EquipmentType.TwoHandedRangedWeapon:
      return "Two Handed Ranged Weapon";
    case EquipmentType.Shield:
      return "Shield";
  }
}
