import { EntityName } from "../../../aliases.js";
import { iterateNumericEnumKeyedRecord } from "../../../utils/index.js";
import {
  Affix,
  AffixCategory,
  EquipmentAffixes,
  PrefixType,
  SuffixType,
} from "../../equipment/affixes.js";
import { EquipmentBaseItem, EquipmentType } from "../../equipment/equipment-types/index.js";
import { formatBodyArmor } from "../../equipment/equipment-types/body-armor.js";
import { formatHeadGear } from "../../equipment/equipment-types/head-gear.js";
import { ONE_HANDED_MELEE_WEAPON_NAMES } from "../../equipment/equipment-types/one-handed-melee-weapon.js";
import { formatTwoHandedMeleeWeapon } from "../../equipment/equipment-types/two-handed-melee-weapon.js";
import { formatTwoHandedRangedWeapon } from "../../equipment/equipment-types/two-handed-ranged-weapon.js";
import { formatShield } from "../../equipment/equipment-types/shield.js";
import { formatRing } from "../../equipment/equipment-types/jewelry.js";
import { formatAmulet } from "../../equipment/equipment-types/jewelry.js";
import { getPrefixName } from "../builders/item-namer/get-prefix-name.js";
import { getSuffixName } from "../builders/item-namer/get-suffix-name.js";

export function buildEquipmentName(
  baseItem: EquipmentBaseItem,
  affixes: EquipmentAffixes
): EntityName {
  let baseItemName: string;
  switch (baseItem.equipmentType) {
    case EquipmentType.BodyArmor:
      baseItemName = formatBodyArmor(baseItem.baseItemType);
      break;
    case EquipmentType.HeadGear:
      baseItemName = formatHeadGear(baseItem.baseItemType);
      break;
    case EquipmentType.OneHandedMeleeWeapon:
      baseItemName = ONE_HANDED_MELEE_WEAPON_NAMES[baseItem.baseItemType];
      break;
    case EquipmentType.TwoHandedMeleeWeapon:
      baseItemName = formatTwoHandedMeleeWeapon(baseItem.baseItemType);
      break;
    case EquipmentType.TwoHandedRangedWeapon:
      baseItemName = formatTwoHandedRangedWeapon(baseItem.baseItemType);
      break;
    case EquipmentType.Shield:
      baseItemName = formatShield(baseItem.baseItemType);
      break;
    case EquipmentType.Ring:
      baseItemName = formatRing(baseItem.baseItemType);
      break;
    case EquipmentType.Amulet:
      baseItemName = formatAmulet(baseItem.baseItemType);
      break;
  }

  const result = addAffixesToEquipmentName(baseItemName, affixes);
  return result;
}

export function addAffixesToEquipmentName(baseItemName: string, affixes: EquipmentAffixes) {
  const prefixNames: string[] = [];
  const suffixNames: string[] = [];

  const prefixes = affixes[AffixCategory.Prefix] as Partial<Record<PrefixType, Affix>> | undefined;
  if (prefixes) {
    for (const [prefixType, affix] of iterateNumericEnumKeyedRecord(prefixes)) {
      prefixNames.push(getPrefixName(prefixType, affix.tier));
    }
  }

  const suffixes = affixes[AffixCategory.Suffix] as Partial<Record<SuffixType, Affix>> | undefined;
  if (suffixes) {
    for (const [suffixType, affix] of iterateNumericEnumKeyedRecord(suffixes)) {
      suffixNames.push(getSuffixName(suffixType, affix.tier));
    }
  }

  const prefix = prefixNames[0] ? prefixNames[0] + " " : "";
  const suffix = suffixNames[0] ? " of " + suffixNames[0] : "";

  return (prefix + baseItemName + suffix) as EntityName;
}
