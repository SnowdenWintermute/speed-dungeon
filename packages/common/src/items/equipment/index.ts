import {
  AffixType,
  Affixes,
  EquipmentBaseItemProperties,
  EquipmentType,
  Item,
  WeaponProperties,
  equipmentIsTwoHandedWeapon,
} from "../index.js";
import { CombatAttribute } from "../../combatants/combat-attributes.js";
import { CombatantAttributeRecord } from "../../combatants/combatant-properties.js";
import { EntityProperties } from "../../primatives/entity-properties.js";
import { MaxAndCurrent } from "../../primatives/max-and-current.js";
import { applyEquipmentTraitsToHpChangeSource } from "./equipment-properties/apply-equipment-traits-to-hp-change-source.js";
import getBaseArmorClass from "./equipment-properties/get-base-armor-class.js";
import getModifiedWeaponDamageRange from "./equipment-properties/get-modified-weapon-damage-range.js";
import { ERROR_MESSAGES } from "../../errors/index.js";

export * from "./equipment-properties/index.js";
export * from "./pre-determined-items/index.js";
export * from "./equipment-traits/index.js";
export * from "./slots.js";
export * from "./equipment-types/index.js";
export * from "./affixes.js";

export class Equipment extends Item {
  attributes: CombatantAttributeRecord = {};
  affixes: Affixes = { [AffixType.Prefix]: {}, [AffixType.Suffix]: {} };
  constructor(
    public entityProperties: EntityProperties,
    public itemLevel: number,
    public requirements: Partial<Record<CombatAttribute, number>>,
    public equipmentBaseItemProperties: EquipmentBaseItemProperties,
    public durability: null | MaxAndCurrent
  ) {
    super(entityProperties, itemLevel, requirements);
  }

  static getBaseArmorClass = getBaseArmorClass;
  static getModifiedWeaponDamageRange = getModifiedWeaponDamageRange;
  static isTwoHanded = equipmentIsTwoHandedWeapon;
  static applyEquipmentTraitsToHpChangeSource = applyEquipmentTraitsToHpChangeSource;

  static getWeaponProperties(equipment: Equipment): Error | WeaponProperties {
    switch (equipment.equipmentBaseItemProperties.type) {
      case EquipmentType.OneHandedMeleeWeapon:
      case EquipmentType.TwoHandedMeleeWeapon:
      case EquipmentType.TwoHandedRangedWeapon:
        return equipment.equipmentBaseItemProperties;
      default:
        return new Error(ERROR_MESSAGES.EQUIPMENT.INVALID_TYPE);
    }
  }
}
