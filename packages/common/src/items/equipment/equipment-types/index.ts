import { BodyArmor } from "./body-armor";
import { HeadGear } from "./head-gear";
import { Jewelry } from "./jewelry";
import { OneHandedMeleeWeapon } from "./one-handed-melee-weapon";
import { Shield } from "./shield";
import { TwoHandedMeleeWeapon } from "./two-handed-melee-weapon";
import { TwoHandedRangedWeapon } from "./two-handed-ranged-weapon";
export * from "./shield";
export * from "./two-handed-ranged-weapon";
export * from "./two-handed-melee-weapon";
export * from "./one-handed-melee-weapon";
export * from "./head-gear";
export * from "./jewelry";

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
  baseItemType: Jewelry;
}
export interface AmuletBaseItemType {
  equipmentType: EquipmentType.Amulet;
  baseItemType: Jewelry;
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
