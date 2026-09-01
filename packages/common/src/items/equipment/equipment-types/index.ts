import type { EquipmentBaseItemOfType } from "../equipment-properties/equipment-properties.js";
import { iterateNumericEnum } from "../../../utils/numeric-enum-iteration.js";
import { BodyArmor } from "./body-armor.js";
import { HeadGear } from "./head-gear.js";
import { Amulet, Ring } from "./jewelry.js";
import { OneHandedMeleeWeapon } from "./one-handed-melee-weapon.js";
import { Shield } from "./shield.js";
import { TwoHandedMeleeWeapon } from "./two-handed-melee-weapon.js";
import { TwoHandedRangedWeapon } from "./two-handed-ranged-weapon.js";

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

/** every base item in the game, tagged with its equipment type so it can be built or looked up
 * without reconstructing the pair from a bare enum key */
export const EQUIPMENT_BASE_ITEMS_BY_TYPE: {
  [K in EquipmentType]: EquipmentBaseItemOfType<K>[];
} = {
  [EquipmentType.BodyArmor]: iterateNumericEnum(BodyArmor).map((baseItemType) => ({
    equipmentType: EquipmentType.BodyArmor,
    baseItemType,
  })),
  [EquipmentType.HeadGear]: iterateNumericEnum(HeadGear).map((baseItemType) => ({
    equipmentType: EquipmentType.HeadGear,
    baseItemType,
  })),
  [EquipmentType.Ring]: iterateNumericEnum(Ring).map((baseItemType) => ({
    equipmentType: EquipmentType.Ring,
    baseItemType,
  })),
  [EquipmentType.Amulet]: iterateNumericEnum(Amulet).map((baseItemType) => ({
    equipmentType: EquipmentType.Amulet,
    baseItemType,
  })),
  [EquipmentType.OneHandedMeleeWeapon]: iterateNumericEnum(OneHandedMeleeWeapon).map(
    (baseItemType) => ({ equipmentType: EquipmentType.OneHandedMeleeWeapon, baseItemType })
  ),
  [EquipmentType.TwoHandedMeleeWeapon]: iterateNumericEnum(TwoHandedMeleeWeapon).map(
    (baseItemType) => ({ equipmentType: EquipmentType.TwoHandedMeleeWeapon, baseItemType })
  ),
  [EquipmentType.TwoHandedRangedWeapon]: iterateNumericEnum(TwoHandedRangedWeapon).map(
    (baseItemType) => ({ equipmentType: EquipmentType.TwoHandedRangedWeapon, baseItemType })
  ),
  [EquipmentType.Shield]: iterateNumericEnum(Shield).map((baseItemType) => ({
    equipmentType: EquipmentType.Shield,
    baseItemType,
  })),
};

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

export const WANDS = [
  OneHandedMeleeWeapon.WillowWand,
  OneHandedMeleeWeapon.MapleWand,
  OneHandedMeleeWeapon.RoseWand,
  OneHandedMeleeWeapon.YewWand,
];

export const STAVES = [
  TwoHandedMeleeWeapon.BoStaff,
  TwoHandedMeleeWeapon.ElmStaff,
  TwoHandedMeleeWeapon.ElementalStaff,
  TwoHandedMeleeWeapon.MahoganyStaff,
  TwoHandedMeleeWeapon.RottingBranch,
  TwoHandedMeleeWeapon.EbonyStaff,
];
