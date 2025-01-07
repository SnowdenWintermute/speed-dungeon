import {
  AffixType,
  ERROR_MESSAGES,
  Equipment,
  TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER,
  equipmentIsTwoHandedWeapon,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { rollAffix } from "../../item-generation/roll-affix.js";

export function randomizeExistingAffixRolls(equipment: Equipment, itemLevelLimiter: number) {
  // since this rolls within the values on the existing affixs' tiers, don't allow
  // if at a vending machine that is not on a floor at least as deep as the item level
  if (!Equipment.isMagical(equipment) || equipment.itemLevel > itemLevelLimiter)
    return new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);

  for (const [prefixType, prefix] of iterateNumericEnumKeyedRecord(
    equipment.affixes[AffixType.Prefix]
  )) {
    let multiplier = 1;
    if (equipmentIsTwoHandedWeapon(equipment.equipmentBaseItemProperties.type))
      multiplier = TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER;
    const affix = rollAffix({ affixType: AffixType.Prefix, prefixType }, prefix.tier, multiplier);
    equipment.affixes[AffixType.Prefix][prefixType] = affix;
  }

  for (const [suffixType, suffix] of iterateNumericEnumKeyedRecord(
    equipment.affixes[AffixType.Suffix]
  )) {
    let multiplier = 1;
    if (equipmentIsTwoHandedWeapon(equipment.equipmentBaseItemProperties.type))
      multiplier = TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER;
    const affix = rollAffix({ affixType: AffixType.Suffix, suffixType }, suffix.tier, multiplier);
    equipment.affixes[AffixType.Suffix][suffixType] = affix;
  }
}
