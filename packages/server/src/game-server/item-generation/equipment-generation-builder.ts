import {
  AffixType,
  Affixes,
  BASE_CHANCE_FOR_ITEM_TO_BE_MAGICAL,
  CHANCE_TO_HAVE_DOUBLE_AFFIX,
  CHANCE_TO_HAVE_PREFIX,
  CombatAttribute,
  EQUIPMENT_TYPE_STRINGS,
  ERROR_MESSAGES,
  EquipmentBaseItem,
  EquipmentBaseItemProperties,
  EquipmentBaseItemType,
  EquipmentType,
  FOUND_ITEM_MAX_DURABILITY_MODIFIER,
  FOUND_ITEM_MIN_DURABILITY_MODIFIER,
  ItemType,
  PrefixType,
  SuffixType,
  TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER,
  TaggedAffixType,
  chooseRandomFromArray,
  equipmentIsTwoHandedWeapon,
  randBetween,
  shuffleArray,
} from "@speed-dungeon/common";
import { EquipmentGenerationTemplate } from "./equipment-templates/equipment-generation-template-abstract-classes.js";
import { getEquipmentGenerationTemplate } from "./equipment-templates/index.js";
import { rollAffix, rollAffixTier } from "./roll-affix.js";
import { ItemNamer } from "./item-names/item-namer.js";
import { ItemGenerationBuilder, TaggedBaseItem } from "./item-generation-builder.js";

export class EquipmentGenerationBuilder<T extends EquipmentGenerationTemplate>
  extends ItemNamer
  implements ItemGenerationBuilder
{
  constructor(
    public templates: Record<EquipmentBaseItemType, T>,
    public equipmentType: EquipmentType
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

    const baseEquipmentItem = chooseRandomFromArray(availableTypesOnThisLevel);
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
    if (baseEquipmentItem.equipmentType !== this.equipmentType)
      return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    const template = getEquipmentGenerationTemplate(baseEquipmentItem);
    if (template === undefined)
      return new Error(
        `missing template for ${JSON.stringify(baseEquipmentItem)} in equipment type ${EQUIPMENT_TYPE_STRINGS[this.equipmentType]}`
      );

    if (template.maxDurability === null) return null;
    const startingDurability = randBetween(
      Math.floor(template.maxDurability * FOUND_ITEM_MIN_DURABILITY_MODIFIER),
      Math.floor(template.maxDurability * FOUND_ITEM_MAX_DURABILITY_MODIFIER)
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
  ): Error | Affixes {
    const affixes: Affixes = { [AffixType.Prefix]: {}, [AffixType.Suffix]: {} };

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
    const prefixTypes = getRandomValidPrefixTypes(template, numAffixesToRoll.prefixes);
    affixTypes.prefix.push(...prefixTypes);
    const suffixTypes = getRandomValidSuffixTypes(template, numAffixesToRoll.suffixes);
    affixTypes.suffix.push(...suffixTypes);

    for (const prefixType of Object.values(affixTypes.prefix)) {
      const affixResult = rollAffixTierAndValue(
        template,
        { affixType: AffixType.Prefix, prefixType },
        itemLevel,
        this.equipmentType
      );
      if (affixResult instanceof Error) return affixResult;
      affixes[AffixType.Prefix][prefixType] = affixResult;
    }

    for (const suffixType of Object.values(affixTypes.suffix)) {
      const affixResult = rollAffixTierAndValue(
        template,
        { affixType: AffixType.Suffix, suffixType },
        itemLevel,
        this.equipmentType
      );
      if (affixResult instanceof Error) return affixResult;
      affixes[AffixType.Suffix][suffixType] = affixResult;
    }

    return affixes;
  }

  buildRequirements(
    taggedBaseItem: TaggedBaseItem,
    _affixes: Affixes | null
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

export function getRandomValidPrefixTypes(
  template: EquipmentGenerationTemplate,
  numToCreate: number
) {
  const toReturn = [];
  const possiblePrefixes = Object.keys(template.possibleAffixes.prefix).map(
    (item) => parseInt(item) as PrefixType
  );
  const shuffledPrefixes = shuffleArray(possiblePrefixes);
  for (let i = 0; i < numToCreate; i += 1) {
    const randomPrefixOption = shuffledPrefixes.pop();
    if (randomPrefixOption !== undefined) toReturn.push(randomPrefixOption);
  }
  return toReturn;
}

export function getRandomValidSuffixTypes(
  template: EquipmentGenerationTemplate,
  numToCreate: number
) {
  const toReturn = [];
  const possibleSuffixes = Object.keys(template.possibleAffixes.suffix).map(
    (item) => parseInt(item) as SuffixType
  );
  const shuffledSuffixes = shuffleArray(possibleSuffixes);
  for (let i = 0; i < numToCreate; i += 1) {
    const randomSuffixOption = shuffledSuffixes.pop();
    if (randomSuffixOption !== undefined) toReturn.push(randomSuffixOption);
  }
  return toReturn;
}

export function rollAffixTierAndValue(
  template: EquipmentGenerationTemplate,
  taggedAffixType: TaggedAffixType,
  maxTierLimiter: number,
  equipmentType: EquipmentType
) {
  const maxTierOption =
    taggedAffixType.affixType === AffixType.Prefix
      ? template.possibleAffixes.prefix[taggedAffixType.prefixType]
      : template.possibleAffixes.suffix[taggedAffixType.suffixType];
  if (maxTierOption === undefined)
    return new Error("invalid template - selected affix type that doesn't exist on template");
  const rolledTier = rollAffixTier(maxTierOption, maxTierLimiter);

  let multiplier = 1;
  if (equipmentIsTwoHandedWeapon(equipmentType))
    multiplier = TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER;
  return rollAffix(taggedAffixType, rolledTier, multiplier);
}
