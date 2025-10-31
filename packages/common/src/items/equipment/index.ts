import { Item } from "../index.js";
import { EntityProperties } from "../../primatives/entity-properties.js";
import { MaxAndCurrent } from "../../primatives/max-and-current.js";
import { getModifiedWeaponDamageRange } from "./equipment-properties/get-modified-weapon-damage-range.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import {
  Affix,
  AffixCategory,
  AffixType,
  EquipmentAffixes,
  PrefixType,
  SuffixType,
} from "./affixes.js";
import { EquipmentBaseItemProperties, WeaponProperties } from "./equipment-properties/index.js";
import { EquipmentType } from "./equipment-types/index.js";
import { EquipmentTraitType } from "./equipment-traits/index.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";
import { iterateNumericEnumKeyedRecord, runIfInBrowser } from "../../utils/index.js";
import { CombatantAttributeRecord } from "../../combatants/attribute-properties.js";
import { ResourceChangeSource } from "../../combat/hp-change-source-types.js";
import { plainToInstance } from "class-transformer";
import makeAutoObservable from "mobx-store-inheritance";

export * from "./equipment-properties/index.js";
export * from "./pre-determined-items/index.js";
export * from "./equipment-traits/index.js";
export * from "./slots.js";
export * from "./equipment-types/index.js";
export * from "./affixes.js";

const WEAPON_EQUIPMENT_TYPES = [
  EquipmentType.OneHandedMeleeWeapon,
  EquipmentType.TwoHandedMeleeWeapon,
  EquipmentType.TwoHandedRangedWeapon,
];

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
    runIfInBrowser(() => makeAutoObservable(this, {}, { autoBind: true }));
  }

  static getDeserialized(plain: Equipment) {
    return plainToInstance(Equipment, plain);
  }

  static getModifiedWeaponDamageRange = getModifiedWeaponDamageRange;

  getBaseArmorClass() {
    switch (this.equipmentBaseItemProperties.equipmentType) {
      case EquipmentType.BodyArmor:
      case EquipmentType.HeadGear:
      case EquipmentType.Shield:
        return this.equipmentBaseItemProperties.armorClass;
      default:
        return 0;
    }
  }

  getNormalizedPercentRepaired() {
    let normalizedPercentRepaired = 1;
    const durability = this.getDurability();
    if (durability) {
      normalizedPercentRepaired = durability.current / durability.max;
    }
    return normalizedPercentRepaired;
  }

  isWeapon() {
    const { equipmentType } = this.equipmentBaseItemProperties.taggedBaseEquipment;
    return WEAPON_EQUIPMENT_TYPES.includes(equipmentType);
  }

  getAffixAttributeValue(affixTypeToFind: AffixType, attributeToFind: CombatAttribute) {
    for (const [category, affixes] of iterateNumericEnumKeyedRecord(this.affixes)) {
      for (const [affixType, affix] of iterateNumericEnumKeyedRecord(affixes)) {
        if (affixType !== affixTypeToFind) continue;
        for (const [attribute, value] of iterateNumericEnumKeyedRecord(affix.combatAttributes)) {
          if (attribute === attributeToFind) return value;
        }
      }
    }
    return 0;
  }

  getModifiedArmorClass() {
    const baseArmorClass = this.getBaseArmorClass();
    const flatArmorClassAffixBonus = this.getAffixAttributeValue(
      AffixType.FlatArmorClass,
      CombatAttribute.ArmorClass
    );
    const withFlatAdditive = baseArmorClass + flatArmorClassAffixBonus;

    let percentModifier = 1.0;

    if (this.affixes[AffixCategory.Suffix]?.[AffixType.PercentArmorClass]) {
      const traitPercentage =
        this.affixes[AffixCategory.Suffix]?.[AffixType.PercentArmorClass].equipmentTraits[
          EquipmentTraitType.ArmorClassPercentage
        ]?.value || 0;
      percentModifier += traitPercentage / 100;
    }

    return Math.floor(withFlatAdditive * percentModifier);
  }

  getDurability() {
    const { durability } = this;
    if (durability === null) return null;
    const { inherentMax, current } = durability;
    let additive = 0;
    const durabilityTraitOption =
      this.affixes[AffixCategory.Suffix]?.[AffixType.Durability]?.equipmentTraits[
        EquipmentTraitType.FlatDurabilityAdditive
      ];
    if (durabilityTraitOption) additive = durabilityTraitOption.value;

    return new MaxAndCurrent(inherentMax + additive, current);
  }

  isRangedWeapon() {
    return this.equipmentBaseItemProperties.equipmentType === EquipmentType.TwoHandedRangedWeapon;
  }

  static isTwoHandedWeaponType(equipmentType: EquipmentType) {
    return (
      equipmentType === EquipmentType.TwoHandedMeleeWeapon ||
      equipmentType === EquipmentType.TwoHandedRangedWeapon
    );
  }

  isTwoHanded() {
    const { equipmentType } = this.equipmentBaseItemProperties;
    return Equipment.isTwoHandedWeaponType(equipmentType);
  }

  applyTraitsToResourceChangeSource(hpChangeSource: ResourceChangeSource) {
    const lifestealAffixOption = this.affixes[AffixCategory.Prefix]?.[AffixType.LifeSteal];

    if (lifestealAffixOption) {
      const lifestealPercentageTrait =
        lifestealAffixOption.equipmentTraits[EquipmentTraitType.LifeSteal];
      if (!lifestealPercentageTrait)
        return new Error(ERROR_MESSAGES.EQUIPMENT.EXPECTED_TRAIT_MISSING);

      hpChangeSource.lifestealPercentage
        ? (hpChangeSource.lifestealPercentage += lifestealPercentageTrait.value)
        : (hpChangeSource.lifestealPercentage = lifestealPercentageTrait.value);
    }
  }

  getWeaponProperties(): Error | WeaponProperties {
    if (!this.isWeapon()) return new Error(ERROR_MESSAGES.EQUIPMENT.INVALID_TYPE);
    return this.equipmentBaseItemProperties as WeaponProperties;
  }

  hasPrefix() {
    return this.iteratePrefixes().length > 0;
  }

  hasSuffix() {
    return this.iterateSuffixes().length > 0;
  }

  insertOrReplaceAffix(affixCategory: AffixCategory, affixType: AffixType, affix: Affix) {
    const existingCategory = this.affixes[affixCategory];
    if (existingCategory === undefined)
      this.affixes[affixCategory] = {
        [affixType]: affix,
      };
    else {
      existingCategory[affixType] = affix;
    }
  }

  iteratePrefixes() {
    const prefixes =
      this.affixes[AffixCategory.Prefix] || ({} as Partial<Record<PrefixType, Affix>>);
    return iterateNumericEnumKeyedRecord(prefixes);
  }

  iterateSuffixes() {
    const suffixes =
      this.affixes[AffixCategory.Suffix] || ({} as Partial<Record<SuffixType, Affix>>);
    return iterateNumericEnumKeyedRecord(suffixes);
  }

  iterateAffixes() {
    const affixes = [
      ...this.iteratePrefixes().map(([affixType, affix]) => affix),
      ...this.iterateSuffixes().map(([affixType, affix]) => affix),
    ];

    return affixes;
  }

  /** If the equipment has ANY of the passed attributes, returns true */
  hasAffixWithAttributes(attributes: CombatAttribute[]) {
    for (const affix of this.iterateAffixes()) {
      for (const [attributeType, value] of iterateNumericEnumKeyedRecord(affix.combatAttributes)) {
        if (attributes.includes(attributeType)) return true;
      }
    }
  }

  isMagical() {
    return this.iterateAffixes().length > 0;
  }

  isJewelry() {
    const { equipmentType } = this.equipmentBaseItemProperties.taggedBaseEquipment;
    return equipmentType === EquipmentType.Ring || equipmentType === EquipmentType.Amulet;
  }

  isIndestructable() {
    return this.durability === null;
  }

  changeDurability(value: number) {
    if (this.isIndestructable() || this.durability === null) return;
    this.durability.current = Math.max(0, this.durability.current + value);
  }

  isBroken() {
    const isIndestructable = this.isIndestructable();
    if (isIndestructable || this.durability === null) return false;
    return this.durability.current <= 0;
  }
}
