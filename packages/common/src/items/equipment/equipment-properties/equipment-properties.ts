import { ResourceChangeSource } from "../../../combat/hp-change-source-types.js";
import { NumberRange } from "../../../primatives/number-range.js";
import {
  AmuletBaseItemType,
  BodyArmorBaseItemType,
  EquipmentBaseItem,
  EquipmentType,
  HeadGearBaseItemType,
  OneHandedMeleeWeaponBaseItemType,
  RingBaseItemType,
  ShieldBaseItemType,
  TwoHandedMeleeWeaponBaseItemType,
  TwoHandedRangedWeaponBaseItemType,
} from "../equipment-types/index.js";
import { ArmorCategory } from "./armor-properties.js";
import { ShieldSize } from "./shield-properties.js";

interface ArmorFields {
  armorCategory: ArmorCategory;
  armorClass: number;
}

interface WeaponFields {
  damage: NumberRange;
  damageClassification: ResourceChangeSource[];
}

export interface BodyArmorProperties extends BodyArmorBaseItemType, ArmorFields {}
export interface HeadGearProperties extends HeadGearBaseItemType, ArmorFields {}
export interface OneHandedMeleeWeaponProperties
  extends OneHandedMeleeWeaponBaseItemType,
    WeaponFields {}
export interface TwoHandedMeleeWeaponProperties
  extends TwoHandedMeleeWeaponBaseItemType,
    WeaponFields {}
export interface TwoHandedRangedWeaponProperties
  extends TwoHandedRangedWeaponBaseItemType,
    WeaponFields {}
export interface ShieldProperties extends ShieldBaseItemType {
  size: ShieldSize;
  armorClass: number;
}
export type RingProperties = RingBaseItemType;
export type AmuletProperties = AmuletBaseItemType;

export type EquipmentProperties =
  | BodyArmorProperties
  | HeadGearProperties
  | OneHandedMeleeWeaponProperties
  | TwoHandedMeleeWeaponProperties
  | TwoHandedRangedWeaponProperties
  | ShieldProperties
  | RingProperties
  | AmuletProperties;

/** groupings for the code that treats a family alike */
export type ArmorProperties = BodyArmorProperties | HeadGearProperties;
export type WeaponProperties =
  | OneHandedMeleeWeaponProperties
  | TwoHandedMeleeWeaponProperties
  | TwoHandedRangedWeaponProperties;
export type JewelryProperties = RingProperties | AmuletProperties;

export type EquipmentBaseItemOfType<K extends EquipmentType> = Extract<
  EquipmentBaseItem,
  { equipmentType: K }
>;

export type BaseItemTypeOf<K extends EquipmentType> = EquipmentBaseItemOfType<K>["baseItemType"];

/** a value per base item, checked at both levels: leave one out and the compiler names it */
export type EquipmentTableByType<V> = {
  [K in EquipmentType]: Record<BaseItemTypeOf<K>, V>;
};
