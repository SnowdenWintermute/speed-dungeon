import { AffixCategory, ERROR_MESSAGES, Equipment, ItemType } from "@speed-dungeon/common";

import { getEquipmentGenerationTemplate } from "../../item-generation/equipment-templates/index.js";
import {
  getRandomValidPrefixTypes,
  getRandomValidSuffixTypes,
  rollAffixTierAndValue,
} from "../../item-generation/equipment-generation-builder.js";
import { getGameServer } from "../../../singletons/index.js";

export function addAffixToItem(equipment: Equipment, itemLevelLimiter: number) {
  const missingPrefix = Equipment.hasSuffix(equipment) && !Equipment.hasPrefix(equipment);
  const missingSuffix = !Equipment.hasSuffix(equipment) && Equipment.hasPrefix(equipment);
  if (!Equipment.isMagical(equipment) || (!missingPrefix && !missingSuffix))
    return new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);

  const template = getEquipmentGenerationTemplate(
    equipment.equipmentBaseItemProperties.taggedBaseEquipment
  );

  if (missingPrefix) {
    const prefixType = getRandomValidPrefixTypes(template, 1)[0];
    if (prefixType === undefined) return new Error("Couldn't generate affix type");
    const affixResult = rollAffixTierAndValue(
      template,
      { affixCategory: AffixCategory.Prefix, prefixType },
      Math.min(equipment.itemLevel, itemLevelLimiter),
      equipment.equipmentBaseItemProperties.equipmentType
    );
    if (affixResult instanceof Error) return affixResult;
    Equipment.insertOrReplaceAffix(equipment, AffixCategory.Prefix, prefixType, affixResult);
  }

  if (missingSuffix) {
    const suffixType = getRandomValidSuffixTypes(template, 1)[0];
    if (suffixType === undefined) return new Error("Couldn't generate affix type");
    const affixResult = rollAffixTierAndValue(
      template,
      { affixCategory: AffixCategory.Suffix, suffixType },
      Math.min(equipment.itemLevel, itemLevelLimiter),
      equipment.equipmentBaseItemProperties.equipmentType
    );
    if (affixResult instanceof Error) return affixResult;
    Equipment.insertOrReplaceAffix(equipment, AffixCategory.Suffix, suffixType, affixResult);
  }

  const { equipmentBaseItemProperties } = equipment;
  const builder = getGameServer().itemGenerationBuilders[equipmentBaseItemProperties.equipmentType];
  const newName = builder.buildItemName(
    {
      type: ItemType.Equipment,
      taggedBaseEquipment: equipmentBaseItemProperties.taggedBaseEquipment,
    },
    equipment.affixes
  );
  equipment.entityProperties.name = newName;
}
