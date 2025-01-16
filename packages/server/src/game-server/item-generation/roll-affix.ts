import {
  Affix,
  AffixType,
  CombatAttribute,
  DEEPEST_FLOOR,
  EquipmentTraitType,
  PrefixType,
  SuffixType,
  TaggedAffixType,
  randBetween,
} from "@speed-dungeon/common";

export function rollAffixTier(maxTier: number, itemLevel: number) {
  const maxTierModifier = itemLevel / DEEPEST_FLOOR;
  const minTierModifier = maxTierModifier / 2.0;
  const maxTierOnLevel = maxTier * maxTierModifier;
  const minTierOnLevel = maxTier * minTierModifier;
  return Math.max(1, Math.round(randBetween(minTierOnLevel, maxTierOnLevel)));
}

const MIN_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER = 3;
const MAX_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER = 7;

export function rollAffix(
  taggedAffixType: TaggedAffixType,
  tier: number,
  attributeMultiplier: number = 1.0
): Affix {
  const affix: Affix = {
    combatAttributes: {},
    equipmentTraits: {},
    tier,
  };

  const rollAttributeValue = (min: number, max: number) =>
    randBetween(tier * (min * attributeMultiplier), tier * (max * attributeMultiplier));

  switch (taggedAffixType.affixType) {
    case AffixType.Prefix:
      switch (taggedAffixType.prefixType) {
        case PrefixType.Mp:
          affix.combatAttributes[CombatAttribute.Mp] = rollAttributeValue(
            MIN_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER,
            MAX_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER
          );
          break;
        case PrefixType.ArmorClass:
          affix.combatAttributes[CombatAttribute.ArmorClass] = rollAttributeValue(1, 3);
          break;
        case PrefixType.Accuracy:
          affix.combatAttributes[CombatAttribute.Accuracy] = rollAttributeValue(
            MIN_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER,
            MAX_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER
          );
          break;
        case PrefixType.PercentDamage:
          affix.equipmentTraits[EquipmentTraitType.DamagePercentage] = {
            equipmentTraitType: EquipmentTraitType.DamagePercentage,
            value: randBetween((tier - 1) * 10 + 1, tier * 10),
          };
          break;
        case PrefixType.LifeSteal:
          affix.equipmentTraits[EquipmentTraitType.LifeSteal] = {
            equipmentTraitType: EquipmentTraitType.LifeSteal,
            value: randBetween((tier - 1) * 10 + 1, tier * 10),
          };
          break;
        case PrefixType.Resilience:
          affix.combatAttributes[CombatAttribute.Resilience] = rollAttributeValue(1, 2);
          break;
        case PrefixType.Evasion:
          affix.combatAttributes[CombatAttribute.Evasion] = rollAttributeValue(
            MIN_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER,
            MAX_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER
          );
          break;
        case PrefixType.ArmorPenetration:
          affix.combatAttributes[CombatAttribute.ArmorPenetration] = rollAttributeValue(
            MIN_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER,
            MAX_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER
          );
          break;
        case PrefixType.Agility:
          affix.combatAttributes[CombatAttribute.Agility] = rollAttributeValue(1, 2);
          break;
        case PrefixType.Focus:
          affix.combatAttributes[CombatAttribute.Focus] = rollAttributeValue(1, 2);
          break;
      }
      break;
    case AffixType.Suffix:
      switch (taggedAffixType.suffixType) {
        case SuffixType.Strength:
          affix.combatAttributes[CombatAttribute.Strength] = rollAttributeValue(1, 2);
          break;
        case SuffixType.Intelligence:
          affix.combatAttributes[CombatAttribute.Intelligence] = rollAttributeValue(1, 2);
          break;
        case SuffixType.Dexterity:
          affix.combatAttributes[CombatAttribute.Dexterity] = rollAttributeValue(1, 2);
          break;
        case SuffixType.Vitality:
          affix.combatAttributes[CombatAttribute.Vitality] = rollAttributeValue(1, 2);
          break;
        case SuffixType.AllBase:
          const min = 1;
          const max = 1;
          affix.combatAttributes[CombatAttribute.Vitality] = rollAttributeValue(min, max);
          affix.combatAttributes[CombatAttribute.Dexterity] = rollAttributeValue(min, max);
          affix.combatAttributes[CombatAttribute.Strength] = rollAttributeValue(min, max);
          affix.combatAttributes[CombatAttribute.Intelligence] = rollAttributeValue(min, max);
          break;
        case SuffixType.Hp:
          affix.combatAttributes[CombatAttribute.Hp] = rollAttributeValue(
            MIN_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER,
            MAX_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER
          );
          break;
        case SuffixType.Damage:
          affix.equipmentTraits[EquipmentTraitType.FlatDamageAdditive] = {
            equipmentTraitType: EquipmentTraitType.FlatDamageAdditive,
            value: rollAttributeValue(1, 2),
          };
          break;
        case SuffixType.PercentArmorClass:
          affix.equipmentTraits[EquipmentTraitType.ArmorClassPercentage] = {
            equipmentTraitType: EquipmentTraitType.ArmorClassPercentage,
            value: randBetween((tier - 1) * 10 + 1, tier * 10),
          };
        case SuffixType.Durability:
          affix.equipmentTraits[EquipmentTraitType.FlatDurabilityAdditive] = {
            equipmentTraitType: EquipmentTraitType.FlatDurabilityAdditive,
            value: randBetween(5 * tier, 10 * tier),
          };
          break;
      }
      break;
  }

  return affix;
}
