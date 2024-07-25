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
    randBetween(tier * min, tier * max) * attributeMultiplier;

  switch (taggedAffixType.affixType) {
    case AffixType.Prefix:
      switch (taggedAffixType.prefixType) {
        case PrefixType.Mp:
          affix.combatAttributes[CombatAttribute.Mp] = rollAttributeValue(2, 5);
          break;
        case PrefixType.ArmorClass:
          affix.combatAttributes[CombatAttribute.ArmorClass] = rollAttributeValue(1, 2);
          break;
        case PrefixType.Accuracy:
          affix.combatAttributes[CombatAttribute.Accuracy] = rollAttributeValue(2, 5);
          break;
        case PrefixType.PercentDamage:
          affix.equipmentTraits[EquipmentTraitType.DamagePercentage] = {
            equipmentTraitType: EquipmentTraitType.DamagePercentage,
            percentage: tier * 10,
          };
          break;
        case PrefixType.LifeSteal:
          affix.equipmentTraits[EquipmentTraitType.LifeSteal] = {
            equipmentTraitType: EquipmentTraitType.LifeSteal,
            percentage: tier * 10,
          };
          break;
        case PrefixType.Resilience:
          affix.combatAttributes[CombatAttribute.Resilience] = rollAttributeValue(1, 2);
          break;
        case PrefixType.Evasion:
          affix.combatAttributes[CombatAttribute.Evasion] = rollAttributeValue(2, 5);
          break;
        case PrefixType.ArmorPenetration:
          affix.combatAttributes[CombatAttribute.ArmorPenetration] = rollAttributeValue(2, 5);
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
          affix.combatAttributes[CombatAttribute.Hp] = rollAttributeValue(2, 5);
          break;
        case SuffixType.Damage:
          affix.combatAttributes[CombatAttribute.Damage] = rollAttributeValue(1, 2);
          break;
        case SuffixType.Durability:
          //
          break;
      }
      break;
  }

  return affix;
}
