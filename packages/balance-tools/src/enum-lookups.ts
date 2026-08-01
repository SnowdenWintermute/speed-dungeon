import {
  AffixType,
  Amulet,
  ArmorCategory,
  BodyArmor,
  EquipmentType,
  HeadGear,
  KineticDamageType,
  MagicalElement,
  OneHandedMeleeWeapon,
  PREFIX_TYPES,
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  Ring,
  Shield,
  ShieldSize,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
  invariant,
} from "@speed-dungeon/common";
import type { EquipmentBaseItem, PrefixType } from "@speed-dungeon/common";
import { SheetRow, assembleEnumMemberLookup } from "./workbook-reader.ts";

export const EQUIPMENT_TYPES_BY_NAME = assembleEnumMemberLookup(EquipmentType);
export const ARMOR_CATEGORIES_BY_NAME = assembleEnumMemberLookup(ArmorCategory);
export const SHIELD_SIZES_BY_NAME = assembleEnumMemberLookup(ShieldSize);
export const AFFIX_TYPES_BY_NAME = assembleEnumMemberLookup(AffixType);
const PREFIX_TYPE_VALUES = new Set<AffixType>(PREFIX_TYPES);

/** AffixType partitions exactly into prefixes and suffixes, so ruling out one leaves the other */
export function isPrefixType(affixType: AffixType): affixType is PrefixType {
  return PREFIX_TYPE_VALUES.has(affixType);
}

const SOURCE_CATEGORIES_BY_NAME = assembleEnumMemberLookup(ResourceChangeSourceCategory);
const KINETIC_TYPES_BY_NAME = assembleEnumMemberLookup(KineticDamageType);
const ELEMENTS_BY_NAME = assembleEnumMemberLookup(MagicalElement);

const BODY_ARMOR_BY_NAME = assembleEnumMemberLookup(BodyArmor);
const HEAD_GEAR_BY_NAME = assembleEnumMemberLookup(HeadGear);
const ONE_HANDED_MELEE_BY_NAME = assembleEnumMemberLookup(OneHandedMeleeWeapon);
const TWO_HANDED_MELEE_BY_NAME = assembleEnumMemberLookup(TwoHandedMeleeWeapon);
const TWO_HANDED_RANGED_BY_NAME = assembleEnumMemberLookup(TwoHandedRangedWeapon);
const SHIELDS_BY_NAME = assembleEnumMemberLookup(Shield);
const RINGS_BY_NAME = assembleEnumMemberLookup(Ring);
const AMULETS_BY_NAME = assembleEnumMemberLookup(Amulet);

export const BASE_ITEMS_BY_NAME: Record<EquipmentType, Map<string, number>> = {
  [EquipmentType.BodyArmor]: BODY_ARMOR_BY_NAME,
  [EquipmentType.HeadGear]: HEAD_GEAR_BY_NAME,
  [EquipmentType.OneHandedMeleeWeapon]: ONE_HANDED_MELEE_BY_NAME,
  [EquipmentType.TwoHandedMeleeWeapon]: TWO_HANDED_MELEE_BY_NAME,
  [EquipmentType.TwoHandedRangedWeapon]: TWO_HANDED_RANGED_BY_NAME,
  [EquipmentType.Shield]: SHIELDS_BY_NAME,
  [EquipmentType.Ring]: RINGS_BY_NAME,
  [EquipmentType.Amulet]: AMULETS_BY_NAME,
};

/** the switch is what keeps the base item enum paired with its equipment type */
export function parseBaseItem(equipmentType: EquipmentType, row: SheetRow): EquipmentBaseItem {
  switch (equipmentType) {
    case EquipmentType.BodyArmor:
      return { equipmentType, baseItemType: row.getEnumMember("baseItem", BODY_ARMOR_BY_NAME) };
    case EquipmentType.HeadGear:
      return { equipmentType, baseItemType: row.getEnumMember("baseItem", HEAD_GEAR_BY_NAME) };
    case EquipmentType.OneHandedMeleeWeapon:
      return {
        equipmentType,
        baseItemType: row.getEnumMember("baseItem", ONE_HANDED_MELEE_BY_NAME),
      };
    case EquipmentType.TwoHandedMeleeWeapon:
      return {
        equipmentType,
        baseItemType: row.getEnumMember("baseItem", TWO_HANDED_MELEE_BY_NAME),
      };
    case EquipmentType.TwoHandedRangedWeapon:
      return {
        equipmentType,
        baseItemType: row.getEnumMember("baseItem", TWO_HANDED_RANGED_BY_NAME),
      };
    case EquipmentType.Shield:
      return { equipmentType, baseItemType: row.getEnumMember("baseItem", SHIELDS_BY_NAME) };
    case EquipmentType.Ring:
      return { equipmentType, baseItemType: row.getEnumMember("baseItem", RINGS_BY_NAME) };
    case EquipmentType.Amulet:
      return { equipmentType, baseItemType: row.getEnumMember("baseItem", AMULETS_BY_NAME) };
  }
}

/** the source text the generated module needs, eg "BodyArmor.Rags" */
export function getBaseItemReference(baseItem: EquipmentBaseItem): string {
  switch (baseItem.equipmentType) {
    case EquipmentType.BodyArmor:
      return `BodyArmor.${BodyArmor[baseItem.baseItemType]}`;
    case EquipmentType.HeadGear:
      return `HeadGear.${HeadGear[baseItem.baseItemType]}`;
    case EquipmentType.OneHandedMeleeWeapon:
      return `OneHandedMeleeWeapon.${OneHandedMeleeWeapon[baseItem.baseItemType]}`;
    case EquipmentType.TwoHandedMeleeWeapon:
      return `TwoHandedMeleeWeapon.${TwoHandedMeleeWeapon[baseItem.baseItemType]}`;
    case EquipmentType.TwoHandedRangedWeapon:
      return `TwoHandedRangedWeapon.${TwoHandedRangedWeapon[baseItem.baseItemType]}`;
    case EquipmentType.Shield:
      return `Shield.${Shield[baseItem.baseItemType]}`;
    case EquipmentType.Ring:
      return `Ring.${Ring[baseItem.baseItemType]}`;
    case EquipmentType.Amulet:
      return `Amulet.${Amulet[baseItem.baseItemType]}`;
  }
}

const ABSENT_SEGMENT = "none";

export function parseDamageClassifications(
  text: string,
  describeRow: string
): ResourceChangeSource[] {
  return text.split("|").map((entry) => {
    const [categoryName, kineticName, elementName] = entry.split(":");
    invariant(
      categoryName !== undefined,
      `${describeRow}: "${entry}" is not a damage classification`
    );

    const category = SOURCE_CATEGORIES_BY_NAME.get(categoryName);
    invariant(category !== undefined, `${describeRow}: "${categoryName}" is not a damage category`);

    let kineticDamageTypeOption: null | KineticDamageType = null;
    if (kineticName !== undefined && kineticName !== ABSENT_SEGMENT) {
      const kineticType = KINETIC_TYPES_BY_NAME.get(kineticName);
      invariant(kineticType !== undefined, `${describeRow}: "${kineticName}" is not a kinetic type`);
      kineticDamageTypeOption = kineticType;
    }

    let elementOption: null | MagicalElement = null;
    if (elementName !== undefined) {
      const element = ELEMENTS_BY_NAME.get(elementName);
      invariant(element !== undefined, `${describeRow}: "${elementName}" is not an element`);
      elementOption = element;
    }

    return new ResourceChangeSource({ category, kineticDamageTypeOption, elementOption });
  });
}
