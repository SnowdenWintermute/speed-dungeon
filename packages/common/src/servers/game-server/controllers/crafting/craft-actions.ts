import { TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER } from "../../../../app-consts.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import {
  CRAFTING_ACTION_DISABLED_CONDITIONS,
  CraftingAction,
} from "../../../../items/crafting/crafting-actions.js";
import { AffixCategory } from "../../../../items/equipment/affixes.js";
import { Equipment } from "../../../../items/equipment/index.js";
import { ItemType } from "../../../../items/index.js";
import { AffixGenerator } from "../../../../items/item-creation/builders/affix-generator/index.js";
import { getEquipmentGenerationTemplate } from "../../../../items/item-creation/equipment-templates/index.js";
import { ItemGenerator } from "../../../../items/item-creation/index.js";

export class ItemCrafter {
  public craftingActionHandlers: Record<
    CraftingAction,
    (equipment: Equipment, itemLevelLimiter: number) => void
  > = {
    [CraftingAction.Repair]: (equipment) => this.repairEquipment(equipment),
    [CraftingAction.Imbue]: (equipment, itemLevelLimiter) =>
      this.makeNonMagicalItemMagical(equipment, itemLevelLimiter),
    [CraftingAction.Augment]: (equipment, itemLevelLimiter) =>
      this.addAffixToItem(equipment, itemLevelLimiter),
    [CraftingAction.Tumble]: (equipment, itemLevelLimiter) =>
      this.replaceExistingWithNewRandomAffixes(equipment, itemLevelLimiter),
    [CraftingAction.Reform]: (equipment, itemLevelLimiter) =>
      this.randomizeBaseItemRollableProperties(equipment, itemLevelLimiter),
    [CraftingAction.Shake]: (equipment, itemLevelLimiter) =>
      this.randomizeExistingAffixRolls(equipment, itemLevelLimiter),
  };

  constructor(private itemGenerator: ItemGenerator) {}
  repairEquipment(equipment: Equipment) {
    const durability = equipment.getDurability();
    if (durability === null || durability.current === durability.max) {
      throw new Error(ERROR_MESSAGES.ITEM.IS_FULLY_REPAIRED);
    }

    equipment.changeDurability(durability.max);
  }

  makeNonMagicalItemMagical(equipment: Equipment, itemLevelLimiter: number) {
    const shouldBeDisabled = CRAFTING_ACTION_DISABLED_CONDITIONS[CraftingAction.Imbue];
    if (shouldBeDisabled(equipment, itemLevelLimiter)) {
      throw new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);
    }
    this.giveNewRandomAffixes(equipment, itemLevelLimiter);
  }

  addAffixToItem(equipment: Equipment, itemLevelLimiter: number) {
    const missingPrefix = equipment.hasSuffix() && !equipment.hasPrefix();
    const missingSuffix = !equipment.hasSuffix() && equipment.hasPrefix();

    if (!equipment.isMagical() || (!missingPrefix && !missingSuffix)) {
      {
        throw new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);
      }
    }

    const template = getEquipmentGenerationTemplate(
      equipment.equipmentBaseItemProperties.taggedBaseEquipment
    );

    if (missingPrefix) {
      const prefixType = AffixGenerator.getRandomValidPrefixTypes(template, 1)[0];
      if (prefixType === undefined) {
        throw new Error("Couldn't generate affix type");
      }
      const affixResult = this.itemGenerator.affixGenerator.rollAffixTierAndValue(
        template,
        { affixCategory: AffixCategory.Prefix, prefixType },
        Math.min(equipment.itemLevel, itemLevelLimiter),
        equipment.equipmentBaseItemProperties.equipmentType
      );
      if (affixResult instanceof Error) {
        throw affixResult;
      }
      equipment.insertOrReplaceAffix(AffixCategory.Prefix, prefixType, affixResult);
    }

    if (missingSuffix) {
      const suffixType = AffixGenerator.getRandomValidSuffixTypes(template, 1)[0];
      if (suffixType === undefined) {
        throw new Error("Couldn't generate affix type");
      }
      const affixResult = this.itemGenerator.affixGenerator.rollAffixTierAndValue(
        template,
        { affixCategory: AffixCategory.Suffix, suffixType },
        Math.min(equipment.itemLevel, itemLevelLimiter),
        equipment.equipmentBaseItemProperties.equipmentType
      );
      if (affixResult instanceof Error) {
        throw affixResult;
      }
      equipment.insertOrReplaceAffix(AffixCategory.Suffix, suffixType, affixResult);
    }

    const { equipmentBaseItemProperties } = equipment;
    const builder =
      this.itemGenerator.itemGenerationBuilders[equipmentBaseItemProperties.equipmentType];
    const newName = builder.buildItemName(
      {
        type: ItemType.Equipment,
        taggedBaseEquipment: equipmentBaseItemProperties.taggedBaseEquipment,
      },
      equipment.affixes
    );
    equipment.entityProperties.name = newName;
  }

  private giveNewRandomAffixes(equipment: Equipment, itemLevelLimiter: number) {
    const { taggedBaseEquipment } = equipment.equipmentBaseItemProperties;
    const builder = this.itemGenerator.itemGenerationBuilders[taggedBaseEquipment.equipmentType];

    const affixesResult = builder.buildAffixes(
      Math.min(equipment.itemLevel, itemLevelLimiter),
      taggedBaseEquipment,
      {
        forcedIsMagical: true,
      }
    );
    if (affixesResult instanceof Error) {
      throw affixesResult;
    }
    equipment.affixes = affixesResult;
    const newName = builder.buildItemName(
      { type: ItemType.Equipment, taggedBaseEquipment },
      affixesResult
    );
    equipment.entityProperties.name = newName;
  }

  replaceExistingWithNewRandomAffixes(equipment: Equipment, itemLevelLimiter: number) {
    const shouldBeDisabled = CRAFTING_ACTION_DISABLED_CONDITIONS[CraftingAction.Tumble];
    if (shouldBeDisabled(equipment, itemLevelLimiter)) {
      throw new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);
    }
    this.giveNewRandomAffixes(equipment, itemLevelLimiter);
  }

  randomizeBaseItemRollableProperties(equipment: Equipment, itemLevelLimiter: number) {
    const shouldBeDisabled = CRAFTING_ACTION_DISABLED_CONDITIONS[CraftingAction.Reform];

    if (shouldBeDisabled(equipment, itemLevelLimiter)) {
      throw new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);
    }
    const builder =
      this.itemGenerator.itemGenerationBuilders[
        equipment.equipmentBaseItemProperties.equipmentType
      ];
    const newBaseItemPropertiesResult = builder.buildEquipmentBaseItemProperties(
      equipment.equipmentBaseItemProperties.taggedBaseEquipment
    );
    if (newBaseItemPropertiesResult instanceof Error) {
      throw newBaseItemPropertiesResult;
    }
    equipment.equipmentBaseItemProperties = newBaseItemPropertiesResult;
  }

  randomizeExistingAffixRolls(equipment: Equipment, itemLevelLimiter: number) {
    const shouldBeDisabled = CRAFTING_ACTION_DISABLED_CONDITIONS[CraftingAction.Shake];
    if (shouldBeDisabled(equipment, itemLevelLimiter)) {
      throw new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);
    }

    const template = getEquipmentGenerationTemplate(
      equipment.equipmentBaseItemProperties.taggedBaseEquipment
    );

    for (const [prefixType, prefix] of equipment.iteratePrefixes()) {
      let multiplier = 1;
      if (equipment.isTwoHanded()) {
        multiplier = TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER;
      }

      const affix = this.itemGenerator.affixGenerator.rollAffix(
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

      const affix = this.itemGenerator.affixGenerator.rollAffix(
        { affixCategory: AffixCategory.Suffix, suffixType },
        suffix.tier,
        multiplier,
        template
      );
      equipment.insertOrReplaceAffix(AffixCategory.Suffix, suffixType, affix);
    }
  }
}
