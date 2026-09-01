import {
  AffixCategory,
  COMBAT_ATTRIBUTE_STRINGS,
  Equipment,
  EquipmentTraitType,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { Affix, PrefixType, SuffixType } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";

interface Props {
  equipment: Equipment;
}

export const CombatAttributesAndTraits = observer(({ equipment }: Props) => {
  const equipmentModDisplaysInPrefixSuffixOrder: string[] = [];
  const affixBonusText: Record<AffixCategory, { attributes: string[]; traits: string[] }> = {
    [AffixCategory.Prefix]: {
      attributes: [],
      traits: [],
    },
    [AffixCategory.Suffix]: {
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

  equipmentModDisplaysInPrefixSuffixOrder.push(...affixBonusText[AffixCategory.Prefix].attributes);
  equipmentModDisplaysInPrefixSuffixOrder.push(...affixBonusText[AffixCategory.Suffix].attributes);
  equipmentModDisplaysInPrefixSuffixOrder.push(...affixBonusText[AffixCategory.Prefix].traits);
  equipmentModDisplaysInPrefixSuffixOrder.push(...affixBonusText[AffixCategory.Suffix].traits);

  return (
    <div className="text-blue-300">
      {equipmentModDisplaysInPrefixSuffixOrder.map((text, i) => (
        <div key={text + i}>{text}</div>
      ))}
    </div>
  );
});

function formatAffixCombatAttributeBonuses(
  affix: Affix,
  affixCategory: AffixCategory,
  prefixOrSuffixType: PrefixType | SuffixType
): Error | string[] {
  if (!affix.combatAttributes) {
    return [];
  }

  const toReturn = [];

  for (const [attribute, value] of iterateNumericEnumKeyedRecord(affix.combatAttributes)) {
    toReturn.push(`+${value} ${COMBAT_ATTRIBUTE_STRINGS[attribute]}`);
  }

  return toReturn;
}

function formatAffixEquipmentTraits(affix: Affix): string[] {
  if (!affix.equipmentTraits) {
    return [];
  }

  const toReturn = [];
  for (const equipmentTrait of Object.values(affix.equipmentTraits)) {
    switch (equipmentTrait.equipmentTraitType) {
      case EquipmentTraitType.FlatDamageAdditive:
        toReturn.push(`+${equipmentTrait.value} weapon damage`);
        break;
      case EquipmentTraitType.FlatDurabilityAdditive:
        toReturn.push(`+${equipmentTrait.value} durability`);
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
