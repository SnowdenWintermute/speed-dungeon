import { ItemNamer } from "./item-namer/index.js";
import { ItemGenerationBuilder, TaggedBaseItem } from "./item.js";
import { EquipmentGenerationTemplate } from "../equipment-templates/base-templates.js";
import { getEquipmentGenerationTemplate } from "../equipment-templates/index.js";
import {
  AffixCategory,
  EQUIPMENT_TYPE_STRINGS,
  EquipmentAffixes,
  EquipmentBaseItem,
  EquipmentBaseItemProperties,
  EquipmentBaseItemType,
  EquipmentType,
  PrefixType,
  SuffixType,
} from "../../equipment/index.js";
import { RandomNumberGenerator } from "../../../utility-classes/randomizers.js";
import { ArrayUtils } from "../../../utils/array-utils.js";
import { ItemType } from "../../index.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { randBetween } from "../../../utils/rand-between.js";
import {
  BASE_CHANCE_FOR_ITEM_TO_BE_MAGICAL,
  CHANCE_TO_HAVE_DOUBLE_AFFIX,
  CHANCE_TO_HAVE_PREFIX,
  CombatAttribute,
  FOUND_ITEM_MAX_DURABILITY_MODIFIER,
  FOUND_ITEM_MIN_DURABILITY_MODIFIER,
} from "../../../index.js";
import { AffixGenerator } from "./affix-generator/index.js";

export class EquipmentGenerationBuilder<T extends EquipmentGenerationTemplate>
  extends ItemNamer
  implements ItemGenerationBuilder
{
  constructor(
    public templates: Record<EquipmentBaseItemType, T>,
    public equipmentType: EquipmentType,
    protected randomNumberGenerator: RandomNumberGenerator,
    private affixGenerator: AffixGenerator
  ) {
    super();
  }

  buildBaseItem(
    itemLevel: number,
    forcedBaseItemOption: TaggedBaseItem | undefined
  ): Error | TaggedBaseItem {
    if (forcedBaseItemOption !== undefined) return forcedBaseItemOption;
    // select random item base from those available for itemLevel
    const availableTypesOnThisLevel: EquipmentBaseItemType[] = [];

    for (const template of Object.values(this.templates)) {
      if (itemLevel >= template.levelRange.min && itemLevel <= template.levelRange.max) {
        availableTypesOnThisLevel.push(template.equipmentBaseItem.baseItemType);
      }
    }

    const baseEquipmentItem = ArrayUtils.chooseRandom(
      availableTypesOnThisLevel,
      this.randomNumberGenerator
    );
    if (baseEquipmentItem instanceof Error) return baseEquipmentItem;

    const toReturn: TaggedBaseItem = {
      type: ItemType.Equipment,
      // @ts-ignore
      taggedBaseEquipment: {
        equipmentType: this.equipmentType,
        baseItemType: baseEquipmentItem,
      },
    };

    return toReturn;
  }

  buildEquipmentBaseItemProperties(
    _baseEquipmentItem: EquipmentBaseItem
  ): Error | EquipmentBaseItemProperties {
    return new Error("Not implemented");
  }

  buildDurability(baseEquipmentItem: EquipmentBaseItem) {
    if (baseEquipmentItem.equipmentType !== this.equipmentType) {
      return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    }
    const template = getEquipmentGenerationTemplate(baseEquipmentItem);

    if (template === undefined) {
      return new Error(
        `missing template for ${JSON.stringify(baseEquipmentItem)} in equipment type ${EQUIPMENT_TYPE_STRINGS[this.equipmentType]}`
      );
    }

    if (template.maxDurability === null) return null;
    const startingDurability = randBetween(
      Math.floor(template.maxDurability * FOUND_ITEM_MIN_DURABILITY_MODIFIER),
      Math.floor(template.maxDurability * FOUND_ITEM_MAX_DURABILITY_MODIFIER),
      this.randomNumberGenerator
    );
    let durability = { inherentMax: template.maxDurability, current: startingDurability };

    return durability;
  }

  buildAffixes(
    itemLevel: number,
    baseEquipmentItem: EquipmentBaseItem,
    options?: {
      forcedIsMagical?: boolean;
      forcedNumAffixes?: { prefixes: number; suffixes: number };
    }
  ): Error | EquipmentAffixes {
    const affixes: EquipmentAffixes = { [AffixCategory.Prefix]: {}, [AffixCategory.Suffix]: {} };

    const template = getEquipmentGenerationTemplate(baseEquipmentItem);

    const isMagical =
      Math.random() < BASE_CHANCE_FOR_ITEM_TO_BE_MAGICAL ||
      baseEquipmentItem.equipmentType === EquipmentType.Amulet ||
      baseEquipmentItem.equipmentType === EquipmentType.Ring ||
      options?.forcedIsMagical;
    if (!isMagical) return affixes;

    let hasPrefix = false;
    let hasSuffix = false;
    let hasBothAffixes = false;

    const roll = Math.random();
    if (roll < CHANCE_TO_HAVE_DOUBLE_AFFIX) hasBothAffixes = true;
    else if (
      roll >= CHANCE_TO_HAVE_DOUBLE_AFFIX &&
      roll < CHANCE_TO_HAVE_PREFIX + CHANCE_TO_HAVE_DOUBLE_AFFIX
    )
      hasPrefix = true;
    else hasSuffix = true;

    const numAffixesToRoll = {
      prefixes: hasPrefix || hasBothAffixes ? 1 : 0,
      suffixes: hasSuffix || hasBothAffixes ? 1 : 0,
    };

    const affixTypes: { prefix: PrefixType[]; suffix: SuffixType[] } = {
      prefix: [],
      suffix: [],
    };

    // look up valid affixes and their tier levels for item type
    const prefixTypes = AffixGenerator.getRandomValidPrefixTypes(
      template,
      numAffixesToRoll.prefixes
    );
    affixTypes.prefix.push(...prefixTypes);
    const suffixTypes = AffixGenerator.getRandomValidSuffixTypes(
      template,
      numAffixesToRoll.suffixes
    );
    affixTypes.suffix.push(...suffixTypes);

    for (const suffixType of Object.values(affixTypes.suffix)) {
      const affixResult = this.affixGenerator.rollAffixTierAndValue(
        template,
        { affixCategory: AffixCategory.Suffix, suffixType },
        itemLevel,
        this.equipmentType
      );
      if (affixResult instanceof Error) return affixResult;

      if (affixes[AffixCategory.Suffix] === undefined) affixes[AffixCategory.Suffix] = {};
      affixes[AffixCategory.Suffix][suffixType] = affixResult;
    }

    for (const prefixType of Object.values(affixTypes.prefix)) {
      const affixResult = this.affixGenerator.rollAffixTierAndValue(
        template,
        { affixCategory: AffixCategory.Prefix, prefixType },
        itemLevel,
        this.equipmentType
      );
      if (affixResult instanceof Error) return affixResult;

      if (affixes[AffixCategory.Prefix] === undefined) affixes[AffixCategory.Prefix] = {};
      affixes[AffixCategory.Prefix][prefixType] = affixResult;
    }

    return affixes;
  }

  buildRequirements(
    taggedBaseItem: TaggedBaseItem,
    _affixes: EquipmentAffixes | null
  ): Error | Partial<Record<CombatAttribute, number>> {
    const toReturn: Partial<Record<CombatAttribute, number>> = {};
    switch (taggedBaseItem.type) {
      case ItemType.Equipment:
        const template = getEquipmentGenerationTemplate(taggedBaseItem.taggedBaseEquipment);
        if (template === undefined)
          return new Error(
            "equipment generation template " +
              taggedBaseItem.taggedBaseEquipment.baseItemType +
              " missing in builder for " +
              EQUIPMENT_TYPE_STRINGS[taggedBaseItem.taggedBaseEquipment.equipmentType]
          );
        return template.requirements;
      case ItemType.Consumable:
        break;
    }

    // look up requirements based on the base item
    // adjust requirements if any affix has an affect on them
    return toReturn;
  }
}
