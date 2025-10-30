import {
  AffixCategory,
  CRAFTING_ACTION_DISABLED_CONDITIONS,
  CraftingAction,
  ERROR_MESSAGES,
  Equipment,
  TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER,
} from "@speed-dungeon/common";
import { rollAffix } from "../../item-generation/roll-affix.js";
import { getEquipmentGenerationTemplate } from "../../item-generation/equipment-templates/index.js";

export function randomizeExistingAffixRolls(equipment: Equipment, itemLevelLimiter: number) {
  const shouldBeDisabled = CRAFTING_ACTION_DISABLED_CONDITIONS[CraftingAction.Shake];
  if (shouldBeDisabled(equipment, itemLevelLimiter))
    return new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);

  const template = getEquipmentGenerationTemplate(
    equipment.equipmentBaseItemProperties.taggedBaseEquipment
  );

  for (const [prefixType, prefix] of equipment.iteratePrefixes()) {
    let multiplier = 1;
    if (equipment.isTwoHanded()) {
      multiplier = TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER;
    }

    const affix = rollAffix(
      { affixCategory: AffixCategory.Prefix, prefixType },
      prefix.tier,
      multiplier,
      template
    );
    equipment.insertOrReplaceAffix(AffixCategory.Prefix, prefixType, affix);
  }

  for (const [suffixType, suffix] of equipment.iterateSuffixes()) {
    let multiplier = 1;
    if (equipment.isTwoHanded()) {
      multiplier = TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER;
    }

    const affix = rollAffix(
      { affixCategory: AffixCategory.Suffix, suffixType },
      suffix.tier,
      multiplier,
      template
    );
    equipment.insertOrReplaceAffix(AffixCategory.Suffix, suffixType, affix);
  }
}
