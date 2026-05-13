import { ERROR_MESSAGES } from "../../../../errors/index.js";
import {
  CRAFTING_ACTION_DISABLED_CONDITIONS,
  CraftingAction,
} from "../../../../items/crafting/crafting-actions.js";
import { AffixCategory } from "../../../../items/equipment/affixes.js";
import { Equipment } from "../../../../items/equipment/index.js";
import { AffixGenerator } from "../../../../items/item-creation/affix-generator.js";
import { getEquipmentGenerationTemplate } from "../../../../items/item-creation/equipment-templates/index.js";
import { EquipmentRandomizer } from "../../../../items/item-creation/item-builder/equipment-randomizer.js";
import { buildEquipmentName } from "../../../../items/item-creation/item-builder/build-equipment-name.js";

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

  constructor(
    private equipmentRandomizer: EquipmentRandomizer,
    private affixGenerator: AffixGenerator
  ) {}

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
    const effectiveItemLevel = Math.min(equipment.itemLevel, itemLevelLimiter);

    if (missingPrefix) {
      const prefixType = this.affixGenerator.getRandomValidPrefixTypes(template, 1)[0];
      if (prefixType === undefined) {
        throw new Error("Couldn't generate affix type");
      }
      const affixResult = this.affixGenerator.rollAffixTierAndValue(
        template,
        { affixCategory: AffixCategory.Prefix, prefixType },
        effectiveItemLevel,
        equipment.equipmentBaseItemProperties.equipmentType
      );
      if (affixResult instanceof Error) {
        throw affixResult;
      }
      equipment.insertOrReplaceAffix(AffixCategory.Prefix, prefixType, affixResult);
    }

    if (missingSuffix) {
      const suffixType = this.affixGenerator.getRandomValidSuffixTypes(template, 1)[0];
      if (suffixType === undefined) {
        throw new Error("Couldn't generate affix type");
      }
      const affixResult = this.affixGenerator.rollAffixTierAndValue(
        template,
        { affixCategory: AffixCategory.Suffix, suffixType },
        effectiveItemLevel,
        equipment.equipmentBaseItemProperties.equipmentType
      );
      if (affixResult instanceof Error) {
        throw affixResult;
      }
      equipment.insertOrReplaceAffix(AffixCategory.Suffix, suffixType, affixResult);
    }

    this.updateEquipmentName(equipment);
  }

  private giveNewRandomAffixes(equipment: Equipment, itemLevelLimiter: number) {
    const { taggedBaseEquipment } = equipment.equipmentBaseItemProperties;
    const template = getEquipmentGenerationTemplate(taggedBaseEquipment);
    const effectiveItemLevel = Math.min(equipment.itemLevel, itemLevelLimiter);

    equipment.affixes = this.equipmentRandomizer.rollAffixes(
      template,
      effectiveItemLevel,
      taggedBaseEquipment.equipmentType,
      { forcedMagical: true }
    );

    this.updateEquipmentName(equipment);
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
    this.equipmentRandomizer.rerollBaseProperties(equipment);
  }

  randomizeExistingAffixRolls(equipment: Equipment, itemLevelLimiter: number) {
    const shouldBeDisabled = CRAFTING_ACTION_DISABLED_CONDITIONS[CraftingAction.Shake];
    if (shouldBeDisabled(equipment, itemLevelLimiter)) {
      throw new Error(ERROR_MESSAGES.ITEM.INVALID_PROPERTIES);
    }

    const template = getEquipmentGenerationTemplate(
      equipment.equipmentBaseItemProperties.taggedBaseEquipment
    );
    this.equipmentRandomizer.rerollAffixValues(equipment, template);
  }

  private updateEquipmentName(equipment: Equipment) {
    equipment.entityProperties.name = buildEquipmentName(
      equipment.equipmentBaseItemProperties.taggedBaseEquipment,
      equipment.affixes
    );
  }
}
