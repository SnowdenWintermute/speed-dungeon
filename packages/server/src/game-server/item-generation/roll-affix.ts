import {
  Affix,
  AffixCategory,
  AffixType,
  CORE_ATTRIBUTES,
  CombatAttribute,
  DEEPEST_FLOOR,
  EquipmentTraitType,
  TaggedAffixType,
  randBetween,
} from "@speed-dungeon/common";
import { rngSingleton } from "../../singletons/index.js";

export function rollAffixTier(maxTier: number, itemLevel: number) {
  const maxTierModifier = itemLevel / DEEPEST_FLOOR;
  const minTierModifier = maxTierModifier / 2.0;
  const maxTierOnLevel = maxTier * maxTierModifier;
  const minTierOnLevel = maxTier * minTierModifier;
  return Math.max(1, Math.round(randBetween(minTierOnLevel, maxTierOnLevel, rngSingleton)));
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
    randBetween(
      tier * (min * attributeMultiplier),
      tier * (max * attributeMultiplier),
      rngSingleton
    );

  switch (taggedAffixType.affixCategory) {
    case AffixCategory.Prefix:
      switch (taggedAffixType.prefixType) {
        case AffixType.Mp:
          affix.combatAttributes[CombatAttribute.Mp] = rollAttributeValue(
            MIN_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER,
            MAX_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER
          );
          break;
        case AffixType.FlatArmorClass:
          affix.combatAttributes[CombatAttribute.ArmorClass] = rollAttributeValue(1, 3);
          break;
        case AffixType.Accuracy:
          affix.combatAttributes[CombatAttribute.Accuracy] = rollAttributeValue(
            MIN_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER,
            MAX_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER
          );
          break;
        case AffixType.PercentDamage:
          affix.equipmentTraits[EquipmentTraitType.DamagePercentage] = {
            equipmentTraitType: EquipmentTraitType.DamagePercentage,
            value: randBetween((tier - 1) * 10 + 1, tier * 10, rngSingleton),
          };
          break;
        case AffixType.LifeSteal:
          affix.equipmentTraits[EquipmentTraitType.LifeSteal] = {
            equipmentTraitType: EquipmentTraitType.LifeSteal,
            value: randBetween((tier - 1) * 10 + 1, tier * 10, rngSingleton),
          };
          break;
        case AffixType.Evasion:
          affix.combatAttributes[CombatAttribute.Evasion] = rollAttributeValue(
            MIN_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER,
            MAX_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER
          );
          break;
        case AffixType.ArmorPenetration:
          affix.combatAttributes[CombatAttribute.ArmorPenetration] = rollAttributeValue(
            MIN_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER,
            MAX_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER
          );
          break;
        case AffixType.Agility:
          affix.combatAttributes[CombatAttribute.Agility] = rollAttributeValue(1, 2);
          break;
      }
      break;
    case AffixCategory.Suffix:
      switch (taggedAffixType.suffixType) {
        case AffixType.Strength:
          affix.combatAttributes[CombatAttribute.Strength] = rollAttributeValue(1, 2);
          break;
        case AffixType.Spirit:
          affix.combatAttributes[CombatAttribute.Spirit] = rollAttributeValue(1, 2);
          break;
        case AffixType.Dexterity:
          affix.combatAttributes[CombatAttribute.Dexterity] = rollAttributeValue(1, 2);
          break;
        case AffixType.Vitality:
          affix.combatAttributes[CombatAttribute.Vitality] = rollAttributeValue(1, 2);
          break;
        case AffixType.AllBase:
          const min = 1;
          const max = 1;
          const value = rollAttributeValue(min, max);
          for (const attribute of CORE_ATTRIBUTES) affix.combatAttributes[attribute] = value;

          break;
        case AffixType.Hp:
          affix.combatAttributes[CombatAttribute.Hp] = rollAttributeValue(
            MIN_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER,
            MAX_DERRIVED_ATTRIBUTE_VALUE_PER_AFFIX_TIER
          );
          break;
        case AffixType.FlatDamage:
          affix.equipmentTraits[EquipmentTraitType.FlatDamageAdditive] = {
            equipmentTraitType: EquipmentTraitType.FlatDamageAdditive,
            value: rollAttributeValue(1, 2),
          };
          break;
        case AffixType.PercentArmorClass:
          affix.equipmentTraits[EquipmentTraitType.ArmorClassPercentage] = {
            equipmentTraitType: EquipmentTraitType.ArmorClassPercentage,
            value: randBetween((tier - 1) * 10 + 1, tier * 10, rngSingleton),
          };
          break;
        case AffixType.Durability:
          affix.equipmentTraits[EquipmentTraitType.FlatDurabilityAdditive] = {
            equipmentTraitType: EquipmentTraitType.FlatDurabilityAdditive,
            value: randBetween(5 * tier, 10 * tier, rngSingleton),
          };
          break;
      }
      break;
  }

  return affix;
}
