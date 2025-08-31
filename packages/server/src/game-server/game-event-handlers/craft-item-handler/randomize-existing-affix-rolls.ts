import {
  AffixCategory,
  CRAFTING_ACTION_DISABLED_CONDITIONS,
  CraftingAction,
  ERROR_MESSAGES,
  Equipment,
  TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER,
  equipmentIsTwoHandedWeapon,
} from "@speed-dungeon/common";
import { rollAffix } from "../../item-generation/roll-affix.js";

export function randomizeExistingAffixRolls(equipment: Equipment, itemLevelLimiter: number) {
  const shouldBeDisabled = CRAFTING_ACTION_DISABLED_CONDITIONS[CraftingAction.Shake];
  if (shouldBeDisabled(equipment, itemLevelLimiter))
    return new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);

  for (const [prefixType, prefix] of Equipment.iteratePrefixes(equipment)) {
    let multiplier = 1;
    if (
      equipmentIsTwoHandedWeapon(
        equipment.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType
      )
    )
      multiplier = TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER;
    const affix = rollAffix(
      { affixCategory: AffixCategory.Prefix, prefixType },
      prefix.tier,
      multiplier
    );
    Equipment.insertOrReplaceAffix(equipment, AffixCategory.Prefix, prefixType, affix);
  }

  for (const [suffixType, suffix] of Equipment.iterateSuffixes(equipment)) {
    let multiplier = 1;
    if (
      equipmentIsTwoHandedWeapon(
        equipment.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType
      )
    )
      multiplier = TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER;
    const affix = rollAffix(
      { affixCategory: AffixCategory.Suffix, suffixType },
      suffix.tier,
      multiplier
    );
    Equipment.insertOrReplaceAffix(equipment, AffixCategory.Suffix, suffixType, affix);
  }
}
