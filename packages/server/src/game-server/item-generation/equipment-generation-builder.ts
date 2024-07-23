import {
  AffixType,
  Affixes,
  CombatAttribute,
  ERROR_MESSAGES,
  EquipmentBaseItem,
  EquipmentBaseItemProperties,
  EquipmentBaseItemType,
  EquipmentType,
  ItemPropertiesType,
  MaxAndCurrent,
  PrefixType,
  SuffixType,
  chooseRandomFromArray,
  equipmentIsTwoHandedWeapon,
  randBetween,
  shuffleArray,
} from "@speed-dungeon/common";
import { ItemGenerationBuilder, TaggedBaseItem } from "./item-generation-builder";
import { EquipmentGenerationTemplate } from "./equipment-templates/equipment-generation-template-abstract-classes";
import { getEquipmentGenerationTemplate } from "./equipment-templates";
import { rollAffix, rollAffixTier } from "./roll-affix";
import { ItemNamer } from "./item-names/item-namer";

export class EquipmentGenerationBuilder<T extends EquipmentGenerationTemplate>
  extends ItemNamer
  implements ItemGenerationBuilder
{
  constructor(
    public templates: Record<EquipmentBaseItemType, T>,
    public equipmentType: EquipmentType,
    public itemLevel: number
  ) {
    super();
  }
  buildBaseItem(forcedBaseItemOption: TaggedBaseItem | undefined): Error | TaggedBaseItem {
    if (forcedBaseItemOption !== undefined) return forcedBaseItemOption;
    // select random item base from those available for this.itemLevel
    const availableTypesOnThisLevel: EquipmentBaseItemType[] = [];
    for (const template of Object.values(this.templates)) {
      if (this.itemLevel >= template.levelRange.min && this.itemLevel <= template.levelRange.max) {
        availableTypesOnThisLevel.push(template.equipmentBaseItem.baseItemType);
      }
    }

    const baseEquipmentItem = chooseRandomFromArray(availableTypesOnThisLevel);
    if (baseEquipmentItem instanceof Error) return baseEquipmentItem;

    const toReturn: TaggedBaseItem = {
      type: ItemPropertiesType.Equipment,
      // @ts-ignore
      baseItem: {
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
    const template = this.templates[baseEquipmentItem.equipmentType];

    if (template.maxDurability === null) return null;
    const startingDurability = randBetween(1, template.maxDurability);
    let durability = new MaxAndCurrent(startingDurability, template.maxDurability);

    return durability;
  }

  buildAffixes(baseEquipmentItem: EquipmentBaseItem): Error | Affixes {
    const template = getEquipmentGenerationTemplate(baseEquipmentItem);
    if (template === undefined) return { prefixes: {}, suffixes: {} };
    // @TODO roll rarity
    // @TODO roll number of prefixes/suffixes
    const numAffixesToRoll = { prefixes: 1, suffixes: 1 };

    const affixTypes: { prefix: PrefixType[]; suffix: SuffixType[] } = {
      prefix: [],
      suffix: [],
    };
    const affixes: Affixes = { prefixes: {}, suffixes: {} };

    // look up valid affixes and their tier levels for item type
    const possiblePrefixes = Object.keys(template.possibleAffixes.prefix).map(
      (item) => parseInt(item) as PrefixType
    );
    const shuffledPrefixes = shuffleArray(possiblePrefixes);
    console.log("shuffledPrefixes:", shuffledPrefixes);
    for (let i = 0; i < numAffixesToRoll.prefixes; i += 1) {
      const randomPrefixOption = shuffledPrefixes.pop();
      console.log("popped prefix from randomized array: ", randomPrefixOption);
      if (randomPrefixOption !== undefined) affixTypes.prefix.push(randomPrefixOption);
    }

    const possibleSuffixes = Object.keys(template.possibleAffixes.suffix).map(
      (item) => parseInt(item) as SuffixType
    );

    const shuffledSuffixes = shuffleArray(possibleSuffixes);
    for (let i = 0; i < numAffixesToRoll.suffixes; i += 1) {
      const randomSuffixOption = shuffledSuffixes.pop();
      if (randomSuffixOption !== undefined) affixTypes.suffix.push(randomSuffixOption);
    }

    /// COMBINE THESE
    /// vvvvvvvvvvvv

    console.log("selected random prefix types: ", affixTypes.prefix);
    for (const prefixType of Object.values(affixTypes.prefix)) {
      const maxTierOption = template.possibleAffixes.prefix[prefixType];
      if (maxTierOption === undefined)
        return new Error("invalid template - selected affix type that doesn't exist on template");
      const rolledTier = rollAffixTier(maxTierOption, this.itemLevel);
      let multiplier = 1;
      if (equipmentIsTwoHandedWeapon(this.equipmentType)) multiplier = 2;

      const affix = rollAffix({ affixType: AffixType.Prefix, prefixType }, rolledTier, multiplier);

      console.log("rolled affix: ", affix);

      affixes.prefixes[prefixType] = affix;
    }

    for (const suffixType of Object.values(affixTypes.suffix)) {
      const maxTierOption = template.possibleAffixes.suffix[suffixType];
      if (maxTierOption === undefined)
        return new Error("invalid template - selected affix type that doesn't exist on template");
      const rolledTier = rollAffixTier(maxTierOption, this.itemLevel);
      let multiplier = 1;
      if (equipmentIsTwoHandedWeapon(this.equipmentType)) multiplier = 2;

      const affix = rollAffix({ affixType: AffixType.Suffix, suffixType }, rolledTier, multiplier);
      affixes.suffixes[suffixType] = affix;
    }
    /// ^^^^^^^^
    /// COMBINE THESE

    return affixes;
  }

  buildRequirements(
    taggedBaseItem: TaggedBaseItem,
    affixes: Affixes | null
  ): Partial<Record<CombatAttribute, number>> {
    // look up requirements based on the base item
    // adjust requirements if any affix has an affect on them
    const toReturn: Partial<Record<CombatAttribute, number>> = {};
    return toReturn;
  }
}
