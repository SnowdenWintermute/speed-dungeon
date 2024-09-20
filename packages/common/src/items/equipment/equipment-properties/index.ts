import { CombatantAttributeRecord } from "../../../combatants/combatant-properties.js";
import { MaxAndCurrent } from "../../../primatives/max-and-current.js";
import { AffixType, Affixes } from "../affixes.js";
import { getEquipableSlots } from "../slots.js";
import { ArmorProperties } from "./armor-properties.js";
import getBaseArmorClass from "./get-base-armor-class.js";
import getModifiedWeaponDamageRange from "./get-modified-weapon-damage-range.js";
import { JewelryProperties } from "./jewelry-properties.js";
import { ShieldProperties } from "./shield-properties.js";
import { WeaponProperties, equipmentIsTwoHandedWeapon } from "./weapon-properties.js";
export * from "./armor-properties.js";
export * from "./jewelry-properties.js";
export * from "./shield-properties.js";
export * from "./weapon-properties.js";

export class EquipmentProperties {
  attributes: CombatantAttributeRecord = {};
  affixes: Affixes = { [AffixType.Prefix]: {}, [AffixType.Suffix]: {} };
  constructor(
    public equipmentBaseItemProperties: EquipmentBaseItemProperties,
    public durability: null | MaxAndCurrent
  ) {}

  static getBaseArmorClass = getBaseArmorClass;
  static getModifiedWeaponDamageRange = getModifiedWeaponDamageRange;
  static isTwoHanded = equipmentIsTwoHandedWeapon;
  static getEquipableSlots = getEquipableSlots;
}

export type EquipmentBaseItemProperties =
  | ArmorProperties
  | WeaponProperties
  | ShieldProperties
  | JewelryProperties;
