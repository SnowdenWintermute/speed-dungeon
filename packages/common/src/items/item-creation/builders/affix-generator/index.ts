import { DEEPEST_FLOOR, TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER } from "../../../../app-consts.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import { RandomNumberGenerator } from "../../../../utility-classes/randomizers.js";
import { ArrayUtils } from "../../../../utils/array-utils.js";
import { randBetween } from "../../../../utils/rand-between.js";
import {
  Affix,
  AffixCategory,
  AffixType,
  PrefixType,
  SuffixType,
  TaggedAffixType,
} from "../../../equipment/affixes.js";
import { EquipmentTraitType } from "../../../equipment/equipment-traits/index.js";
import { EquipmentType } from "../../../equipment/equipment-types/index.js";
import { Equipment } from "../../../equipment/index.js";
import { EquipmentGenerationTemplate } from "../../equipment-templates/base-templates.js";

const ATTRIBUTE_PER_TIER_BASE = 1.25;
// since core attributes give several derived attributes,
// we need to give a lot more of a single derived attribute
// for the affix to be worth considering
const DERIVED_ATTRIBUTE_MULTIPLIER = 2.5;

export class AffixGenerator {
  constructor(private randomNumberGenerator: RandomNumberGenerator) {}

  rollAffixTierAndValue(
    template: EquipmentGenerationTemplate,
    taggedAffixType: TaggedAffixType,
    maxTierLimiter: number,
    equipmentType: EquipmentType
  ) {
    const maxTierOption =
      taggedAffixType.affixCategory === AffixCategory.Prefix
        ? template.possibleAffixes.prefix[taggedAffixType.prefixType]
        : template.possibleAffixes.suffix[taggedAffixType.suffixType];
    if (maxTierOption === undefined)
      return new Error("invalid template - selected affix type that doesn't exist on template");
    const rolledTier = this.rollAffixTier(maxTierOption, maxTierLimiter);

    let multiplier = 1;
    const equipmentIsTwoHandedWeapon = Equipment.isTwoHandedWeaponType(equipmentType);
    if (equipmentIsTwoHandedWeapon) multiplier = TWO_HANDED_WEAPON_AFFIX_VALUE_MULTIPILER;
    return this.rollAffix(taggedAffixType, rolledTier, multiplier, template);
  }

  rollAffixTier(maxTier: number, itemLevel: number) {
    const maxTierModifier = itemLevel / DEEPEST_FLOOR;
    const minTierModifier = maxTierModifier / 2.0;
    const maxTierOnLevel = maxTier * maxTierModifier;
    const minTierOnLevel = maxTier * minTierModifier;
    return Math.max(
      1,
      Math.round(randBetween(minTierOnLevel, maxTierOnLevel, this.randomNumberGenerator))
    );
  }

  rollAffix(
    taggedAffixType: TaggedAffixType,
    tier: number,
    rangeMultiplier: number = 1.0, // for 2h weapons that need to double their range to be competitive with dual wield
    template: EquipmentGenerationTemplate
  ): Affix {
    const affix: Affix = {
      combatAttributes: {},
      equipmentTraits: {},
      tier,
    };

    let affixType: AffixType;
    if (taggedAffixType.affixCategory === AffixCategory.Suffix)
      affixType = taggedAffixType.suffixType;
    else affixType = taggedAffixType.prefixType;

    const attributeOption = ATTRIBUTE_AFFIX_ATTRIBUTES[affixType];
    if (attributeOption !== undefined) {
      const range = this.getAffixValueRange(affixType, tier, rangeMultiplier);
      const value = randBetween(range.min, range.max, this.randomNumberGenerator);
      affix.combatAttributes[attributeOption] = value;
    }

    const traitTypeOption = TRAIT_AFFIX_TRAITS[affixType];
    if (traitTypeOption !== undefined) {
      let min = (tier - 1) * 10 + 1;
      let max = tier * 10;

      // durability handled uniquely
      if (traitTypeOption === EquipmentTraitType.FlatDurabilityAdditive) {
        min = 5 * tier;
        max = 10 * tier;
      }
      // flat damage handled uniquely
      if (affixType === AffixType.FlatDamage) {
        const range = this.getAffixValueRange(affixType, tier, rangeMultiplier);
        min = range.min;
        max = range.max;
      }

      const value = randBetween((tier - 1) * 10 + 1, tier * 10, this.randomNumberGenerator);

      affix.equipmentTraits[traitTypeOption] = {
        equipmentTraitType: traitTypeOption,
        value,
      };
    }

    return affix;
  }

  static getRandomValidPrefixTypes(template: EquipmentGenerationTemplate, numToCreate: number) {
    const toReturn: PrefixType[] = [];
    const possiblePrefixes = Object.keys(template.possibleAffixes.prefix).map(
      (item) => parseInt(item) as PrefixType
    );
    const shuffledPrefixes = ArrayUtils.shuffle(possiblePrefixes);
    for (let i = 0; i < numToCreate; i += 1) {
      const randomPrefixOption = shuffledPrefixes.pop();
      if (randomPrefixOption !== undefined) toReturn.push(randomPrefixOption);
    }
    return toReturn;
  }

  static getRandomValidSuffixTypes(template: EquipmentGenerationTemplate, numToCreate: number) {
    const toReturn: SuffixType[] = [];
    const possibleSuffixes = Object.keys(template.possibleAffixes.suffix).map(
      (item) => parseInt(item) as SuffixType
    );
    const shuffledSuffixes = ArrayUtils.shuffle(possibleSuffixes);
    for (let i = 0; i < numToCreate; i += 1) {
      const randomSuffixOption = shuffledSuffixes.pop();
      if (randomSuffixOption !== undefined) toReturn.push(randomSuffixOption);
    }
    return toReturn;
  }

  private getAffixValueRange(affixType: AffixType, tier: number, rangeMultiplier: number) {
    const isCoreAttributeAffix = CORE_ATTRIBUTE_AFFIXES.includes(affixType);
    if (isCoreAttributeAffix) return this.getAttributeAffixValueRange(tier, [rangeMultiplier]);
    const isDerivedAttributeAffix = DERIVED_ATTRIBUTE_AFFIXES.includes(affixType);
    if (isDerivedAttributeAffix)
      return this.getAttributeAffixValueRange(tier, [
        rangeMultiplier,
        DERIVED_ATTRIBUTE_MULTIPLIER,
      ]);

    throw new Error("no number range defined for this affix type");
  }

  private getAttributeAffixValueRange(tier: number, rangeMultipliers: number[]) {
    let min = Math.round(ATTRIBUTE_PER_TIER_BASE * tier - 1) * 2;
    let max = Math.round(ATTRIBUTE_PER_TIER_BASE * tier) * 2;
    for (const multiplier of rangeMultipliers) {
      min *= multiplier;
      max *= multiplier;
    }
    return new NumberRange(Math.max(1, min), Math.max(1, max));
  }
}

const CORE_ATTRIBUTE_AFFIXES = [
  AffixType.Strength,
  AffixType.Dexterity,
  AffixType.Spirit,
  AffixType.Vitality,
  AffixType.Agility,
  AffixType.FlatDamage, // not a core attribute but we want to roll same values
];

const DERIVED_ATTRIBUTE_AFFIXES = [
  AffixType.Mp,
  AffixType.FlatArmorClass,
  AffixType.Accuracy,
  AffixType.Evasion,
  AffixType.ArmorPenetration,
  AffixType.Hp,
];

const ATTRIBUTE_AFFIX_ATTRIBUTES: Partial<Record<AffixType, CombatAttribute>> = {
  [AffixType.Mp]: CombatAttribute.Mp,
  [AffixType.FlatArmorClass]: CombatAttribute.ArmorClass,
  [AffixType.Accuracy]: CombatAttribute.Accuracy,
  [AffixType.Evasion]: CombatAttribute.Evasion,
  [AffixType.ArmorPenetration]: CombatAttribute.ArmorPenetration,
  [AffixType.Agility]: CombatAttribute.Agility,
  [AffixType.Strength]: CombatAttribute.Strength,
  [AffixType.Spirit]: CombatAttribute.Spirit,
  [AffixType.Dexterity]: CombatAttribute.Dexterity,
  [AffixType.Vitality]: CombatAttribute.Vitality,
  [AffixType.Hp]: CombatAttribute.Hp,
};

const TRAIT_AFFIX_TRAITS: Partial<Record<AffixType, EquipmentTraitType>> = {
  [AffixType.PercentDamage]: EquipmentTraitType.DamagePercentage,
  [AffixType.FlatDamage]: EquipmentTraitType.FlatDamageAdditive,
  [AffixType.LifeSteal]: EquipmentTraitType.LifeSteal,
  [AffixType.Durability]: EquipmentTraitType.FlatDurabilityAdditive,
  [AffixType.PercentArmorClass]: EquipmentTraitType.ArmorClassPercentage,
};
