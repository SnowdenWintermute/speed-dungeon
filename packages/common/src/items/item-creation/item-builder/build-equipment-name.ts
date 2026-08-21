import { EntityName } from "../../../aliases.js";
import { iterateNumericEnumKeyedRecord } from "../../../utils/index.js";
import {
  Affix,
  AffixCategory,
  EquipmentAffixes,
  PrefixType,
  SuffixType,
} from "../../equipment/affixes.js";
import { EquipmentBaseItem } from "../../equipment/equipment-types/index.js";
import { getPrefixName } from "../builders/item-namer/get-prefix-name.js";
import { getSuffixName } from "../builders/item-namer/get-suffix-name.js";
import { Equipment } from "../../equipment/index.js";

export function buildEquipmentName(
  baseItem: EquipmentBaseItem,
  affixes: EquipmentAffixes
): EntityName {
  const baseItemName = Equipment.getBaseItemStringName(baseItem);
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
