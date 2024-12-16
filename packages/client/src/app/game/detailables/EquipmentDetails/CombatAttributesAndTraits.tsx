import {
  COMBAT_ATTRIBUTE_STRINGS,
  CORE_ATTRIBUTES,
  Equipment,
  EquipmentTraitType,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { Affix, AffixType, PrefixType, SuffixType } from "@speed-dungeon/common";
import React from "react";

interface Props {
  equipment: Equipment;
}

export default function CombatAttributesAndTraits({ equipment }: Props) {
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

  for (const [affixCategory, affixes] of iterateNumericEnumKeyedRecord(equipment.affixes)) {
    for (const [affixType, affix] of iterateNumericEnumKeyedRecord(affixes)) {
      const formattedAttributeBonusResult = formatAffixCombatAttributeBonuses(
        affix,
        affixCategory,
        affixType
      );
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
    <div className="text-blue-300">
      {equipmentModDisplaysInPrefixSuffixOrder.map((text, i) => (
        <div key={text + i}>{text}</div>
      ))}
    </div>
  );
}

function formatAffixCombatAttributeBonuses(
  affix: Affix,
  affixCategory: AffixType,
  prefixOrSuffixType: PrefixType | SuffixType
): Error | string[] {
  const toReturn = [];

  if (affixCategory === AffixType.Suffix && prefixOrSuffixType === SuffixType.AllBase) {
    let lastCoreAttributeValue = null;
    for (const attribute of CORE_ATTRIBUTES) {
      const coreAttributeValueOnThisAffix = affix.combatAttributes[attribute];
      if (typeof coreAttributeValueOnThisAffix === undefined)
        return new Error("invalid use of the AllBase suffix");
      if (lastCoreAttributeValue === null) lastCoreAttributeValue = coreAttributeValueOnThisAffix;
      else if (coreAttributeValueOnThisAffix !== lastCoreAttributeValue)
        new Error("invalid use of the AllBase suffix");
    }

    toReturn.push(`+${lastCoreAttributeValue} to core attributes`);
  } else {
    for (const [attribute, value] of iterateNumericEnumKeyedRecord(affix.combatAttributes)) {
      toReturn.push(`+${value} ${COMBAT_ATTRIBUTE_STRINGS[attribute]}`);
    }
  }

  return toReturn;
}

function formatAffixEquipmentTraits(affix: Affix): string[] {
  const toReturn = [];
  for (const equipmentTrait of Object.values(affix.equipmentTraits)) {
    switch (equipmentTrait.equipmentTraitType) {
      case EquipmentTraitType.FlatDamageAdditive:
        toReturn.push(`+${equipmentTrait.value} weapon damage`);
        break;
      case EquipmentTraitType.ArmorClassPercentage:
        toReturn.push(`+${equipmentTrait.value}% armor class`);
        break;
      case EquipmentTraitType.LifeSteal:
        toReturn.push(`Heal for ${equipmentTrait.value}% of damage dealt`);
        break;
      case EquipmentTraitType.DamagePercentage:
        toReturn.push(`+${equipmentTrait.value}% weapon damage`);
        break;
    }
  }
  return toReturn;
}
