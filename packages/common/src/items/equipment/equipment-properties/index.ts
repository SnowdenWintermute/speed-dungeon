import { CombatantAttributeRecord } from "../../../combatants/combatant-properties";
import { MaxAndCurrent } from "../../../primatives/max-and-current";
import { Affixes } from "../affixes";
import { EquipmentBaseItem } from "../equipment-types";
import { getEquipableSlots } from "../slots";
import { ArmorProperties } from "./armor-properties";
import getBaseArmorClass from "./get-base-armor-class";
import getModifiedWeaponDamageRange from "./get-modified-weapon-damage-range";
import { JewelryProperties } from "./jewelry-properties";
import { ShieldProperties } from "./shield-properties";
import { WeaponProperties, equipmentIsTwoHandedWeapon } from "./weapon-properties";
export * from "./armor-properties";
export * from "./jewelry-properties";
export * from "./shield-properties";
export * from "./weapon-properties";

export class EquipmentProperties {
  attributes: CombatantAttributeRecord = {};
  affixes: Affixes = { prefixes: [], suffixes: [] };
  constructor(
    public baseItem: EquipmentBaseItem, // put this inside EquipmentBaseItemProperties so matching it yields correct baseItemProperties
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
