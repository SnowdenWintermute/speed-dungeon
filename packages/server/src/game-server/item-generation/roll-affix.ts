import {
  Affix,
  AffixCategory,
  AffixType,
  ArrayUtils,
  CORE_ATTRIBUTES,
  CombatAttribute,
  DEEPEST_FLOOR,
  EquipmentTraitType,
  NumberRange,
  TaggedAffixType,
  randBetween,
  throwIfError,
} from "@speed-dungeon/common";
import { rngSingleton } from "../../singletons/index.js";
import { EquipmentGenerationTemplate } from "./equipment-templates/equipment-generation-template-abstract-classes.js";
import { getRandomValidSuffixTypes } from "./equipment-generation-builder.js";
import { copySelectedModifiersFromResourceChangeSource } from "@speed-dungeon/common/src/combat/combat-actions/action-calculation-utils/copy-selected-modifiers-from-hp-change-source.js";

export function rollAffixTier(maxTier: number, itemLevel: number) {
  const maxTierModifier = itemLevel / DEEPEST_FLOOR;
  const minTierModifier = maxTierModifier / 2.0;
  const maxTierOnLevel = maxTier * maxTierModifier;
  const minTierOnLevel = maxTier * minTierModifier;
  return Math.max(1, Math.round(randBetween(minTierOnLevel, maxTierOnLevel, rngSingleton)));
}

export function rollAffix(
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
    const range = getAffixValueRange(affixType, tier, rangeMultiplier);
    const value = randBetween(range.min, range.max, rngSingleton);
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
      const range = getAffixValueRange(affixType, tier, rangeMultiplier);
      min = range.min;
      max = range.max;
    }

    const value = randBetween((tier - 1) * 10 + 1, tier * 10, rngSingleton);

    affix.equipmentTraits[traitTypeOption] = {
      equipmentTraitType: traitTypeOption,
      value,
    };
  }

  return affix;
}

const ATTRIBUTE_PER_TIER_BASE = 1.25;
// since core attributes give several derived attributes,
// we need to give a lot more of a single derived attribute
// for the affix to be worth considering
const DERIVED_ATTRIBUTE_MULTIPLIER = 2.5;

function getAffixValueRange(affixType: AffixType, tier: number, rangeMultiplier: number) {
  const isCoreAttributeAffix = CORE_ATTRIBUTE_AFFIXES.includes(affixType);
  if (isCoreAttributeAffix) return getAttributeAffixValueRange(tier, [rangeMultiplier]);
  const isDerivedAttributeAffix = DERIVED_ATTRIBUTE_AFFIXES.includes(affixType);
  if (isDerivedAttributeAffix)
    return getAttributeAffixValueRange(tier, [rangeMultiplier, DERIVED_ATTRIBUTE_MULTIPLIER]);

  throw new Error("no number range defined for this affix type");
}

function getAttributeAffixValueRange(tier: number, rangeMultipliers: number[]) {
  let min = Math.round(ATTRIBUTE_PER_TIER_BASE * tier - 1) * 2;
  let max = Math.round(ATTRIBUTE_PER_TIER_BASE * tier) * 2;
  for (const multiplier of rangeMultipliers) {
    min *= multiplier;
    max *= multiplier;
  }
  return new NumberRange(Math.max(1, min), Math.max(1, max));
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
