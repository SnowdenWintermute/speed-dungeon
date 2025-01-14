import { Item } from "../index.js";
import { CombatantAttributeRecord } from "../../combatants/combatant-properties.js";
import { EntityProperties } from "../../primatives/entity-properties.js";
import { MaxAndCurrent } from "../../primatives/max-and-current.js";
import { applyEquipmentTraitsToHpChangeSource } from "./equipment-properties/apply-equipment-traits-to-hp-change-source.js";
import getBaseArmorClass from "./equipment-properties/get-base-armor-class.js";
import getModifiedWeaponDamageRange from "./equipment-properties/get-modified-weapon-damage-range.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { CombatAttribute } from "../../attributes/index.js";
import { AffixType, Affixes, PrefixType, SuffixType } from "./affixes.js";
import {
  EquipmentBaseItemProperties,
  WeaponProperties,
  equipmentIsTwoHandedWeapon,
} from "./equipment-properties/index.js";
import { EquipmentType } from "./equipment-types/index.js";
import { EquipmentTraitType } from "./equipment-traits/index.js";

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

  static getNormalizedPercentRepaired(equipment: Equipment) {
    let normalizedPercentRepaired = 1;
    const { durability } = equipment;
    if (durability) {
      normalizedPercentRepaired = durability.current / durability.max;
    }
    return normalizedPercentRepaired;
  }

  static hasArmorClass(equipment: Equipment) {
    return (
      equipment.equipmentBaseItemProperties.equipmentType === EquipmentType.BodyArmor ||
      equipment.equipmentBaseItemProperties.equipmentType === EquipmentType.Shield ||
      equipment.equipmentBaseItemProperties.equipmentType === EquipmentType.HeadGear
    );
  }

  static getModifiedArmorClass(equipment: Equipment) {
    const baseArmorClass = Equipment.getBaseArmorClass(equipment);
    let withFlatAdditive = baseArmorClass;
    if (equipment.affixes[AffixType.Prefix][PrefixType.ArmorClass]) {
      withFlatAdditive +=
        equipment.affixes[AffixType.Prefix][PrefixType.ArmorClass].combatAttributes[
          CombatAttribute.ArmorClass
        ] || 0;
    }
    let percentModifier = 1.0;
    if (equipment.affixes[AffixType.Suffix][SuffixType.PercentArmorClass]) {
      const traitPercentage =
        equipment.affixes[AffixType.Suffix][SuffixType.PercentArmorClass].equipmentTraits[
          EquipmentTraitType.ArmorClassPercentage
        ]?.value || 0;
      percentModifier += traitPercentage / 100;
    }

    return Math.floor(withFlatAdditive * percentModifier);
  }
  static getModifiedWeaponDamageRange = getModifiedWeaponDamageRange;
  static isTwoHanded = equipmentIsTwoHandedWeapon;
  static applyEquipmentTraitsToHpChangeSource = applyEquipmentTraitsToHpChangeSource;

  static getWeaponProperties(equipment: Equipment): Error | WeaponProperties {
    if (!Equipment.isWeapon(equipment)) return new Error(ERROR_MESSAGES.EQUIPMENT.INVALID_TYPE);
    return equipment.equipmentBaseItemProperties as WeaponProperties;
  }

  static hasPrefix(equipment: Equipment) {
    return Object.values(equipment.affixes[AffixType.Prefix]).length > 0;
  }
  static hasSuffix(equipment: Equipment) {
    return Object.values(equipment.affixes[AffixType.Suffix]).length > 0;
  }
  static isMagical(equipment: Equipment) {
    return Equipment.hasPrefix(equipment) || Equipment.hasSuffix(equipment);
  }

  static isJewelry(equipment: Equipment) {
    const { equipmentType } = equipment.equipmentBaseItemProperties.taggedBaseEquipment;
    return equipmentType === EquipmentType.Ring || equipmentType === EquipmentType.Amulet;
  }

  static isWeapon(equipment: Equipment) {
    const { equipmentType } = equipment.equipmentBaseItemProperties.taggedBaseEquipment;
    return (
      equipmentType === EquipmentType.OneHandedMeleeWeapon ||
      equipmentType === EquipmentType.TwoHandedMeleeWeapon ||
      equipmentType === EquipmentType.TwoHandedRangedWeapon
    );
  }
}
