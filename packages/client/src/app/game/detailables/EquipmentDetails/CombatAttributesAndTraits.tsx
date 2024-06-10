import {
  CORE_ATTRIBUTES,
  CombatAttribute,
  CombatantAttributeRecord,
  EquipmentProperties,
  formatCombatAttribute,
} from "@speed-dungeon/common";
import { Affix, AffixType, PrefixType, SuffixType } from "@speed-dungeon/common";
import { EquipmentTraitType } from "@speed-dungeon/common/src/items/equipment/equipment-traits";
import React from "react";

interface Props {
  equipmentProperties: EquipmentProperties;
}

export default function CombatAttributesAndTraits({ equipmentProperties }: Props) {
  let equipmentModDisplaysInPrefixSuffixOrder = [];
  const lowestCoreAttributeValueOption = getLowestCoreAttributeValue(equipmentProperties);
  const lowestCoreAttributeValue = lowestCoreAttributeValueOption || 0;

  for (const affix of equipmentProperties.affixes) {
    let text = "";
    switch (affix.affixType) {
      case AffixType.Prefix:
        switch (affix.prefixType) {
          case PrefixType.Mp:
            text = formatBonus(equipmentProperties, CombatAttribute.Mp);
            break;
          case PrefixType.ArmorClass:
            text = `${affix.tier * 10}% increased armor class`;
            break;
          case PrefixType.PercentDamage:
          case PrefixType.LifeSteal:
            text = formatEquipmentTrait(equipmentProperties, affix);
            break;
          case PrefixType.Accuracy:
            text = formatBonus(equipmentProperties, CombatAttribute.Accuracy);
            break;
          case PrefixType.Resilience:
            text = formatBonus(equipmentProperties, CombatAttribute.Resilience);
            break;
          case PrefixType.Evasion:
            text = formatBonus(equipmentProperties, CombatAttribute.Evasion);
            break;
          case PrefixType.ArmorPenetration:
            text = formatBonus(equipmentProperties, CombatAttribute.ArmorPenetration);
            break;
          case PrefixType.Agility:
            text = formatBonus(equipmentProperties, CombatAttribute.Agility);
            break;
          case PrefixType.Focus:
            text = formatBonus(equipmentProperties, CombatAttribute.Focus);
            break;
        }
        break;
      case AffixType.Suffix:
        break;
    }
    if (text !== "") equipmentModDisplaysInPrefixSuffixOrder.push(text);
  }
  for (const affix of equipmentProperties.affixes) {
    let text = "";
    switch (affix.affixType) {
      case AffixType.Prefix:
        break;
      case AffixType.Suffix:
        switch (affix.suffixType) {
          case SuffixType.Strength:
            text = formatCoreAttributeBonus(
              equipmentProperties,
              CombatAttribute.Strength,
              lowestCoreAttributeValue
            );
            break;
          case SuffixType.Intelligence:
            text = formatCoreAttributeBonus(
              equipmentProperties,
              CombatAttribute.Intelligence,
              lowestCoreAttributeValue
            );
            break;
          case SuffixType.Dexterity:
            text = formatCoreAttributeBonus(
              equipmentProperties,
              CombatAttribute.Dexterity,
              lowestCoreAttributeValue
            );
            break;
          case SuffixType.Vitality:
            text = formatCoreAttributeBonus(
              equipmentProperties,
              CombatAttribute.Vitality,
              lowestCoreAttributeValue
            );
            break;
          case SuffixType.AllBase:
            text = `+${lowestCoreAttributeValue} to all core attributes`;
            break;
          case SuffixType.Hp:
            text = formatBonus(equipmentProperties, CombatAttribute.Hp);
            break;
          case SuffixType.Damage:
            text = formatBonus(equipmentProperties, CombatAttribute.Damage);
            break;
          case SuffixType.Durability:
            text = formatEquipmentTrait(equipmentProperties, affix);
        }
        break;
    }
    if (text !== "") equipmentModDisplaysInPrefixSuffixOrder.push(text);
  }

  return (
    <div>
      {equipmentModDisplaysInPrefixSuffixOrder.map((text, i) => (
        <div key={text + i}>{text}</div>
      ))}
    </div>
  );
}

function formatBonus(equipmentProperties: EquipmentProperties, attribute: CombatAttribute): string {
  const value = equipmentProperties.attributes[attribute] || 0;
  return `+${value} ${formatCombatAttribute(attribute)}`;
}

function getLowestCoreAttributeValue(equipmentProperties: EquipmentProperties): null | number {
  let coreAttributeValues: CombatantAttributeRecord = {};

  for (const [attributeKey, value] of Object.entries(equipmentProperties.attributes)) {
    const attribute = attributeKey as unknown as CombatAttribute;
    if (CORE_ATTRIBUTES.includes(attribute)) {
      coreAttributeValues[attribute] = value;
    }
  }

  let lowestCoreAttributeOption = null;
  for (const value of Object.values(coreAttributeValues)) {
    if (
      lowestCoreAttributeOption === null ||
      (lowestCoreAttributeOption !== null && lowestCoreAttributeOption > value)
    ) {
      lowestCoreAttributeOption = value;
    }
  }
  return lowestCoreAttributeOption;
}

function formatCoreAttributeBonus(
  equipmentProperties: EquipmentProperties,
  attribute: CombatAttribute,
  lowestCoreAttribute: number
) {
  const totalValue = equipmentProperties.attributes[attribute] || 0;
  const valueNotIncludingAllBase = totalValue - lowestCoreAttribute;
  return `+${valueNotIncludingAllBase} ${formatCombatAttribute(attribute)}`;
}

function formatEquipmentTrait(equipmentProperties: EquipmentProperties, affix: Affix) {
  for (const trait of equipmentProperties.traits) {
    switch (affix.affixType) {
      case AffixType.Prefix:
        switch (affix.prefixType) {
          case PrefixType.ArmorClass:
            if (trait.type === EquipmentTraitType.ArmorClassPercentage) {
              return `+${trait.value}% armor class`;
            }
          case PrefixType.PercentDamage:
            if (trait.type === EquipmentTraitType.DamagePercentage) {
              return `+${trait.value}% weapon damage`;
            }
          case PrefixType.LifeSteal:
            if (trait.type === EquipmentTraitType.LifeStealPercentage) {
              return `${trait.value}% lifesteal`;
            }
          default:
            break;
        }
        break;
      case AffixType.Suffix:
        switch (affix.suffixType) {
          case SuffixType.Durability:
            if (trait.type === EquipmentTraitType.DurabilityBonus) {
              return "Increased durability";
            }
        }
    }
  }
  return "";
}
