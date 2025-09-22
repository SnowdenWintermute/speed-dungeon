import { Item } from "../index.js";
import { EntityProperties } from "../../primatives/entity-properties.js";
import { MaxAndCurrent } from "../../primatives/max-and-current.js";
import { applyEquipmentTraitsToResourceChangeSource } from "./equipment-properties/apply-equipment-traits-to-hp-change-source.js";
import getBaseArmorClass from "./equipment-properties/get-base-armor-class.js";
import getModifiedWeaponDamageRange from "./equipment-properties/get-modified-weapon-damage-range.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import {
  Affix,
  AffixCategory,
  AffixType,
  EquipmentAffixes,
  PrefixType,
  SuffixType,
} from "./affixes.js";
import {
  EquipmentBaseItemProperties,
  WeaponProperties,
  equipmentIsTwoHandedWeapon,
} from "./equipment-properties/index.js";
import { EquipmentType } from "./equipment-types/index.js";
import { EquipmentTraitType } from "./equipment-traits/index.js";
import { CombatantAttributeRecord, CombatantProperties } from "../../combatants/index.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { IActionUser } from "../../combatant-context/action-user.js";

export * from "./equipment-properties/index.js";
export * from "./pre-determined-items/index.js";
export * from "./equipment-traits/index.js";
export * from "./slots.js";
export * from "./equipment-types/index.js";
export * from "./affixes.js";

export class Equipment extends Item {
  attributes: CombatantAttributeRecord = {};
  affixes: EquipmentAffixes = {};
  constructor(
    public entityProperties: EntityProperties,
    public itemLevel: number,
    public requirements: Partial<Record<CombatAttribute, number>>,
    public equipmentBaseItemProperties: EquipmentBaseItemProperties,
    public durability: null | { current: number; inherentMax: number }
  ) {
    super(entityProperties, itemLevel, requirements);
  }

  static getBaseArmorClass = getBaseArmorClass;

  static getNormalizedPercentRepaired(equipment: Equipment) {
    let normalizedPercentRepaired = 1;
    const durability = Equipment.getDurability(equipment);
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

  static getAffixAttributeValue(
    equipment: Equipment,
    affixTypeToFind: AffixType,
    attributeToFind: CombatAttribute
  ) {
    for (const [category, affixes] of iterateNumericEnumKeyedRecord(equipment.affixes)) {
      for (const [affixType, affix] of iterateNumericEnumKeyedRecord(affixes)) {
        if (affixType !== affixTypeToFind) continue;
        for (const [attribute, value] of iterateNumericEnumKeyedRecord(affix.combatAttributes)) {
          if (attribute === attributeToFind) return value;
        }
      }
    }
    return 0;
  }

  static getModifiedArmorClass(equipment: Equipment) {
    const baseArmorClass = Equipment.getBaseArmorClass(equipment);
    const flatArmorClassAffixBonus = Equipment.getAffixAttributeValue(
      equipment,
      AffixType.FlatArmorClass,
      CombatAttribute.ArmorClass
    );
    const withFlatAdditive = baseArmorClass + flatArmorClassAffixBonus;

    let percentModifier = 1.0;

    if (equipment.affixes[AffixCategory.Suffix]?.[AffixType.PercentArmorClass]) {
      const traitPercentage =
        equipment.affixes[AffixCategory.Suffix]?.[AffixType.PercentArmorClass].equipmentTraits[
          EquipmentTraitType.ArmorClassPercentage
        ]?.value || 0;
      percentModifier += traitPercentage / 100;
    }

    return Math.floor(withFlatAdditive * percentModifier);
  }

  static getDurability(equipment: Equipment) {
    const { durability } = equipment;
    if (durability === null) return null;
    const { inherentMax, current } = durability;
    let additive = 0;
    const durabilityTraitOption =
      equipment.affixes[AffixCategory.Suffix]?.[AffixType.Durability]?.equipmentTraits[
        EquipmentTraitType.FlatDurabilityAdditive
      ];
    if (durabilityTraitOption) additive = durabilityTraitOption.value;

    return new MaxAndCurrent(inherentMax + additive, current);
  }

  static getModifiedWeaponDamageRange = getModifiedWeaponDamageRange;
  static isTwoHanded = equipmentIsTwoHandedWeapon;
  static isRangedWeapon(equipment: Equipment) {
    return (
      equipment.equipmentBaseItemProperties.equipmentType === EquipmentType.TwoHandedRangedWeapon
    );
  }
  static applyEquipmentTraitsToResourceChangeSource = applyEquipmentTraitsToResourceChangeSource;

  static getWeaponProperties(equipment: Equipment): Error | WeaponProperties {
    if (!Equipment.isWeapon(equipment)) return new Error(ERROR_MESSAGES.EQUIPMENT.INVALID_TYPE);
    return equipment.equipmentBaseItemProperties as WeaponProperties;
  }

  static hasPrefix(equipment: Equipment) {
    return Equipment.iteratePrefixes(equipment).length > 0;
  }
  static hasSuffix(equipment: Equipment) {
    return Equipment.iterateSuffixes(equipment).length > 0;
  }

  static insertOrReplaceAffix(
    equipment: Equipment,
    affixCategory: AffixCategory,
    affixType: AffixType,
    affix: Affix
  ) {
    const existingCategory = equipment.affixes[affixCategory];
    if (existingCategory === undefined)
      equipment.affixes[affixCategory] = {
        [affixType]: affix,
      };
    else {
      existingCategory[affixType] = affix;
    }
  }

  static iteratePrefixes(equipment: Equipment) {
    const prefixes =
      equipment.affixes[AffixCategory.Prefix] || ({} as Partial<Record<PrefixType, Affix>>);
    return iterateNumericEnumKeyedRecord(prefixes);
  }
  static iterateSuffixes(equipment: Equipment) {
    const suffixes =
      equipment.affixes[AffixCategory.Suffix] || ({} as Partial<Record<SuffixType, Affix>>);
    return iterateNumericEnumKeyedRecord(suffixes);
  }

  static iterateAffixes(equipment: Equipment) {
    const affixes = [
      ...Equipment.iteratePrefixes(equipment).map(([affixType, affix]) => affix),
      ...Equipment.iterateSuffixes(equipment).map(([affixType, affix]) => affix),
    ];

    return affixes;
  }

  /** If the equipment has ANY of the passed attributes, returns true */
  static hasAffixWithAttributes(equipment: Equipment, attributes: CombatAttribute[]) {
    for (const affix of Equipment.iterateAffixes(equipment)) {
      for (const [attributeType, value] of iterateNumericEnumKeyedRecord(affix.combatAttributes)) {
        if (attributes.includes(attributeType)) return true;
      }
    }
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

  static isIndestructable(equipment: Equipment) {
    return equipment.durability === null;
  }

  static changeDurability(equipment: Equipment, value: number) {
    if (Equipment.isIndestructable(equipment) || equipment.durability === null) return;
    equipment.durability.current = Math.max(0, equipment.durability.current + value);
  }

  static isBroken(equipment: Equipment) {
    const isIndestructable = Equipment.isIndestructable(equipment);
    if (isIndestructable || equipment.durability === null) return false;
    return equipment.durability.current <= 0;
  }

  static isUsable(actionUser: IActionUser, equipment: Equipment): boolean {
    const isBroken = Equipment.isBroken(equipment);
    if (isBroken) return false;
    // @REFACTOR - move this function off of combatant since it is now generalized to IActionUser
    return CombatantProperties.combatantHasRequiredAttributesToUseItem(actionUser, equipment);
  }
}
