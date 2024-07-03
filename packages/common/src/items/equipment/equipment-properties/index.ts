import { CombatantAttributeRecord } from "../../../combatants/combatant-properties";
import MaxAndCurrent from "../../../primatives/max-and-current";
import { Affix } from "../affixes";
import { EquipmentTrait } from "../equipment-traits";
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

export class EquipmentProperties {
  attributes: CombatantAttributeRecord = {};
  affixes: Affix[] = [];
  traits: EquipmentTrait[] = [];
  constructor(
    public baseItem: EquipmentBaseItem,
    public equipmentTypeProperties: EquipmentTypeProperties,
    public durability: null | MaxAndCurrent
  ) {}

  static getBaseArmorClass = getBaseArmorClass;
  static getModifiedWeaponDamageRange = getModifiedWeaponDamageRange;
  static isTwoHanded = equipmentIsTwoHandedWeapon;
  static getEquipableSlots = getEquipableSlots;
}

export type EquipmentTypeProperties =
  | ArmorProperties
  | WeaponProperties
  | ShieldProperties
  | JewelryProperties;
