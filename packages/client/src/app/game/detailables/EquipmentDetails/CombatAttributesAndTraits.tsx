import {
  CORE_ATTRIBUTES,
  CombatAttribute,
  EquipmentProperties,
  EquipmentTraitType,
  formatCombatAttribute,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { Affix, AffixType, PrefixType, SuffixType } from "@speed-dungeon/common";
import React from "react";

interface Props {
  equipmentProperties: EquipmentProperties;
}

export default function CombatAttributesAndTraits({ equipmentProperties }: Props) {
  let equipmentModDisplaysInPrefixSuffixOrder: string[] = [];
  const affixBonusText: Record<AffixType, { attributes: string[]; traits: string[] }> = {
    [AffixType.Prefix]: {
      attributes: [],
      traits: [],
    },
    [AffixType.Suffix]: {
      attributes: [],
      traits: [],
    },
  };

  for (const [affixCategory, affixes] of iterateNumericEnumKeyedRecord(
    equipmentProperties.affixes
  )) {
    for (const [key, affix] of Object.entries(affixes)) {
      const affixType = parseInt(key) as SuffixType | PrefixType;
      const formattedAttributeBonusResult = formatAffixCombatAttributeBonuses(affix, affixType);
      if (formattedAttributeBonusResult instanceof Error)
        return <div>{formattedAttributeBonusResult.message}</div>;
      affixBonusText[affixCategory].attributes.push(...formattedAttributeBonusResult);
      affixBonusText[affixCategory].traits.push(...formatAffixEquipmentTraits(affix));
    }
  }

  equipmentModDisplaysInPrefixSuffixOrder.push(...affixBonusText[AffixType.Prefix].attributes);
  equipmentModDisplaysInPrefixSuffixOrder.push(...affixBonusText[AffixType.Suffix].attributes);
  equipmentModDisplaysInPrefixSuffixOrder.push(...affixBonusText[AffixType.Prefix].traits);
  equipmentModDisplaysInPrefixSuffixOrder.push(...affixBonusText[AffixType.Suffix].traits);

  return (
    <div>
      {equipmentModDisplaysInPrefixSuffixOrder.map((text, i) => (
        <div key={text + i}>{text}</div>
      ))}
    </div>
  );
}

function formatAffixCombatAttributeBonuses(
  affix: Affix,
  prefixOrSuffixType: PrefixType | SuffixType
): Error | string[] {
  const toReturn = [];

  if (prefixOrSuffixType === SuffixType.AllBase) {
    let lastCoreAttributeValue = null;
    for (const attribute of CORE_ATTRIBUTES) {
      const coreAttributeValueOnThisAffix = affix.combatAttributes[attribute];
      if (typeof coreAttributeValueOnThisAffix === undefined)
        return new Error("invalid use of the AllBase suffix");
      if (lastCoreAttributeValue === null) lastCoreAttributeValue = coreAttributeValueOnThisAffix;
      else if (coreAttributeValueOnThisAffix !== lastCoreAttributeValue)
        new Error("invalid use of the AllBase suffix");
    }

    toReturn.push(`+ ${lastCoreAttributeValue} to core attributes`);
  } else {
    for (const [attribute, value] of iterateNumericEnumKeyedRecord(affix.combatAttributes)) {
      toReturn.push(`+${value} ${formatCombatAttribute(attribute)}`);
    }
  }

  return toReturn;
}

function formatAffixEquipmentTraits(affix: Affix): string[] {
  const toReturn = [];
  for (const equipmentTrait of Object.values(affix.equipmentTraits)) {
    switch (equipmentTrait.equipmentTraitType) {
      case EquipmentTraitType.ArmorClassPercentage:
        toReturn.push(`+ ${equipmentTrait.percentage}% armor class`);
      case EquipmentTraitType.LifeSteal:
        toReturn.push(`Heal ${equipmentTrait.percentage}% of damage dealt on hit`);
      case EquipmentTraitType.DamagePercentage:
        toReturn.push(`+ ${equipmentTrait.percentage}% weapon damage`);
    }
  }
  return toReturn;
}
