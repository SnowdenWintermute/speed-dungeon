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
import { EquipmentBaseItemProperties } from "./equipment-properties/index.js";
import { EquipmentBaseItem, EquipmentType } from "./equipment-types/index.js";
import { EquipmentTraitType } from "./equipment-traits/index.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { instanceToPlain, plainToInstance } from "class-transformer";
import makeAutoObservable from "mobx-store-inheritance";
import { ShieldProperties, WeaponProperties } from "./equipment-properties/index.js";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import {
  COMPATIBLE_SLOT_IDS_BY_EQUIPMENT_TYPE,
  EquipmentSlotId,
  EquipmentSlotType,
  SLOT_TYPE_BY_SLOT_ID,
} from "../../combatants/combatant-equipment/types.js";
import { BODY_ARMOR_TYPE_STRINGS } from "./equipment-types/body-armor.js";
import { TWO_HANDED_MELEE_WEAPON_TYPE_STRINGS } from "./equipment-types/two-handed-melee-weapon.js";
import { ONE_HANDED_MELEE_WEAPON_NAMES } from "./equipment-types/one-handed-melee-weapon.js";
import { HEADGEAR_TYPE_STRINGS } from "./equipment-types/head-gear.js";
import { TWO_HANDED_RANGED_WEAPON_TYPE_STRINGS } from "./equipment-types/two-handed-ranged-weapon.js";
import { SHIELD_TYPE_STRINGS } from "./equipment-types/shield.js";
import { NumberRange } from "../../primatives/number-range.js";

const WEAPON_EQUIPMENT_TYPES = [
  EquipmentType.OneHandedMeleeWeapon,
  EquipmentType.TwoHandedMeleeWeapon,
  EquipmentType.TwoHandedRangedWeapon,
];

export class Equipment extends Item implements Serializable, ReactiveNode {
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

  makeObservable() {
    makeAutoObservable(this);
  }

  toSerialized() {
    return instanceToPlain(this);
  }

  static fromSerialized(serialized: SerializedOf<Equipment>) {
    const equipment = plainToInstance(Equipment, serialized);
    const weaponProperties = equipment.getWeaponPropertiesOption();
    if (weaponProperties !== undefined) {
      weaponProperties.damage = NumberRange.fromSerialized(weaponProperties.damage);
    }
    return equipment;
  }

  static getModifiedWeaponDamageRange = getModifiedWeaponDamageRange;

  static getBaseItemStringName(baseItem: EquipmentBaseItem) {
    switch (baseItem.equipmentType) {
      case EquipmentType.BodyArmor:
        return BODY_ARMOR_TYPE_STRINGS[baseItem.baseItemType];
      case EquipmentType.HeadGear:
        return HEADGEAR_TYPE_STRINGS[baseItem.baseItemType];
      case EquipmentType.OneHandedMeleeWeapon:
        return ONE_HANDED_MELEE_WEAPON_NAMES[baseItem.baseItemType];
      case EquipmentType.TwoHandedMeleeWeapon:
        return TWO_HANDED_MELEE_WEAPON_TYPE_STRINGS[baseItem.baseItemType];
      case EquipmentType.TwoHandedRangedWeapon:
        return TWO_HANDED_RANGED_WEAPON_TYPE_STRINGS[baseItem.baseItemType];
      case EquipmentType.Shield:
        return SHIELD_TYPE_STRINGS[baseItem.baseItemType];
      case EquipmentType.Ring:
        return "Ring";
      case EquipmentType.Amulet:
        return "Amulet";
    }
  }

  getBaseArmorClass() {
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
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
    const { equipmentType } = this.equipmentBaseItemProperties;
    return WEAPON_EQUIPMENT_TYPES.includes(equipmentType);
  }

  isShield() {
    const { equipmentType } = this.equipmentBaseItemProperties;
    return equipmentType === EquipmentType.Shield;
  }

  getShieldProperties() {
    if (!this.isShield()) return new Error(ERROR_MESSAGES.EQUIPMENT.INVALID_TYPE);
    return this.equipmentBaseItemProperties as ShieldProperties;
  }

  getAffixOption(affixTypeToFind: AffixType) {
    for (const [_category, affixes] of iterateNumericEnumKeyedRecord(this.affixes)) {
      for (const [affixType, affix] of iterateNumericEnumKeyedRecord(affixes)) {
        if (affixType === affixTypeToFind) return affix;
      }
    }
  }

  getAffixAttributeValue(affixTypeToFind: AffixType, attributeToFind: CombatAttribute) {
    const affixOption = this.getAffixOption(affixTypeToFind);
    if (!affixOption) {
      return 0;
    }

    for (const [attribute, value] of iterateNumericEnumKeyedRecord(affixOption.combatAttributes)) {
      if (attribute === attributeToFind) return value;
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

  getLifestealPercentage(): number {
    const lifestealAffixOption = this.affixes[AffixCategory.Prefix]?.[AffixType.LifeSteal];
    if (!lifestealAffixOption) return 0;

    const lifestealPercentageTrait =
      lifestealAffixOption.equipmentTraits[EquipmentTraitType.LifeSteal];
    if (!lifestealPercentageTrait) return 0;

    return lifestealPercentageTrait.value;
  }

  getFlatDamageBonus(): number {
    const flatDamageAffixOption = this.affixes[AffixCategory.Suffix]?.[AffixType.FlatDamage];
    if (!flatDamageAffixOption) return 0;

    const flatDamageTrait =
      flatDamageAffixOption.equipmentTraits[EquipmentTraitType.FlatDamageAdditive];
    if (!flatDamageTrait) return 0;

    return flatDamageTrait.value;
  }

  getWeaponPropertiesOption() {
    if (!this.isWeapon()) {
      return undefined;
    }
    return this.equipmentBaseItemProperties as WeaponProperties;
  }

  requireWeaponProperties() {
    const option = this.getWeaponPropertiesOption();
    if (!option) {
      throw new Error(ERROR_MESSAGES.EQUIPMENT.INVALID_TYPE);
    }
    return option;
  }

  hasPrefix() {
    return this.iteratePrefixes().length > 0;
  }

  hasSuffix() {
    return this.iterateSuffixes().length > 0;
  }

  insertOrReplaceAffix(affixCategory: AffixCategory, affixType: AffixType, affix: Affix) {
    const existingCategory = this.affixes[affixCategory];
    if (existingCategory === undefined) {
      this.affixes[affixCategory] = {
        [affixType]: affix,
      };
    } else {
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
    const { equipmentType } = this.equipmentBaseItemProperties;
    return equipmentType === EquipmentType.Ring || equipmentType === EquipmentType.Amulet;
  }

  isIndestructable() {
    return this.durability === null;
  }

  changeDurability(value: number) {
    const durability = this.getDurability();
    if (durability === null || this.isIndestructable() || this.durability === null) {
      return;
    }
    this.durability.current = Math.min(
      durability.max,
      Math.max(0, this.durability.current + value)
    );
  }

  isFullyRepaired() {
    return this.isIndestructable() || this.getDurability()?.isMax();
  }

  isBroken() {
    const isIndestructable = this.isIndestructable();
    if (isIndestructable || this.durability === null) return false;
    return this.durability.current <= 0;
  }

  getCompatibleSlots() {
    const { equipmentType } = this.equipmentBaseItemProperties;
    const compatibleSlotIds = COMPATIBLE_SLOT_IDS_BY_EQUIPMENT_TYPE[equipmentType];
    const { main, alternate } = compatibleSlotIds;
    const compatibleSlotTypes = new Set<EquipmentSlotType>().add(SLOT_TYPE_BY_SLOT_ID[main]);
    if (alternate !== undefined) {
      compatibleSlotTypes.add(SLOT_TYPE_BY_SLOT_ID[alternate]);
    }

    return { compatibleSlotIds, compatibleSlotTypes };
  }

  isCompatibleWithSlotId(slotId: EquipmentSlotId) {
    const { compatibleSlotIds } = this.getCompatibleSlots();
    return Object.values(compatibleSlotIds).includes(slotId);
  }

  static groupBySlotTypeCompatibility(equipmentList: Equipment[]) {
    const equipmentBySlotType: Record<EquipmentSlotType, Equipment[]> = {
      [EquipmentSlotType.Head]: [],
      [EquipmentSlotType.Body]: [],
      [EquipmentSlotType.Finger]: [],
      [EquipmentSlotType.Neck]: [],
      [EquipmentSlotType.MainHand]: [],
      [EquipmentSlotType.OffHand]: [],
    };

    for (const equipment of equipmentList) {
      const { compatibleSlotTypes } = equipment.getCompatibleSlots();

      for (const slotType of compatibleSlotTypes) {
        equipmentBySlotType[slotType].push(equipment);
      }
    }

    return equipmentBySlotType;
  }

  static groupBySlotIdCompatibility(equipmentList: Equipment[]) {
    const equipmentBySlotIds: Record<EquipmentSlotId, Set<Equipment>> = {
      [EquipmentSlotId.Head]: new Set(),
      [EquipmentSlotId.Body]: new Set(),
      [EquipmentSlotId.FingerMain]: new Set(),
      [EquipmentSlotId.FingerAlternate]: new Set(),
      [EquipmentSlotId.Neck]: new Set(),
      [EquipmentSlotId.MainHand]: new Set(),
      [EquipmentSlotId.OffHand]: new Set(),
    };

    for (const equipment of equipmentList) {
      const { compatibleSlotIds } = equipment.getCompatibleSlots();
      for (const slotId of Object.values(compatibleSlotIds)) {
        equipmentBySlotIds[slotId].add(equipment);
      }
    }

    return equipmentBySlotIds;
  }
}
