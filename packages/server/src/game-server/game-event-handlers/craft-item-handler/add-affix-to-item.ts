import {
  AffixCategory,
  AffixGenerator,
  ERROR_MESSAGES,
  Equipment,
  ItemType,
  getEquipmentGenerationTemplate,
} from "@speed-dungeon/common";

import { getGameServer } from "../../../singletons/index.js";

export function addAffixToItem(equipment: Equipment, itemLevelLimiter: number) {
  const missingPrefix = equipment.hasSuffix() && !equipment.hasPrefix();
  const missingSuffix = !equipment.hasSuffix() && equipment.hasPrefix();

  if (!equipment.isMagical() || (!missingPrefix && !missingSuffix)) {
    return new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);
  }

  const template = getEquipmentGenerationTemplate(
    equipment.equipmentBaseItemProperties.taggedBaseEquipment
  );

  if (missingPrefix) {
    const prefixType = AffixGenerator.getRandomValidPrefixTypes(template, 1)[0];
    if (prefixType === undefined) return new Error("Couldn't generate affix type");
    const affixResult = getGameServer().itemGenerator.affixGenerator.rollAffixTierAndValue(
      template,
      { affixCategory: AffixCategory.Prefix, prefixType },
      Math.min(equipment.itemLevel, itemLevelLimiter),
      equipment.equipmentBaseItemProperties.equipmentType
    );
    if (affixResult instanceof Error) return affixResult;
    equipment.insertOrReplaceAffix(AffixCategory.Prefix, prefixType, affixResult);
  }

  if (missingSuffix) {
    const suffixType = AffixGenerator.getRandomValidSuffixTypes(template, 1)[0];
    if (suffixType === undefined) return new Error("Couldn't generate affix type");
    const affixResult = getGameServer().itemGenerator.affixGenerator.rollAffixTierAndValue(
      template,
      { affixCategory: AffixCategory.Suffix, suffixType },
      Math.min(equipment.itemLevel, itemLevelLimiter),
      equipment.equipmentBaseItemProperties.equipmentType
    );
    if (affixResult instanceof Error) return affixResult;
    equipment.insertOrReplaceAffix(AffixCategory.Suffix, suffixType, affixResult);
  }

  const { equipmentBaseItemProperties } = equipment;
  const builder =
    getGameServer().itemGenerator.itemGenerationBuilders[equipmentBaseItemProperties.equipmentType];
  const newName = builder.buildItemName(
    {
      type: ItemType.Equipment,
      taggedBaseEquipment: equipmentBaseItemProperties.taggedBaseEquipment,
    },
    equipment.affixes
  );
  equipment.entityProperties.name = newName;
}
