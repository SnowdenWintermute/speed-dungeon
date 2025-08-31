import { NumberRange } from "../../../primatives/number-range.js";
import { AffixCategory, AffixType, EquipmentAffixes } from "../affixes.js";
import { EquipmentTraitType } from "../equipment-traits/index.js";

export default function getModifiedWeaponDamageRange(
  affixes: EquipmentAffixes,
  damage: NumberRange
): NumberRange {
  const prefixes = affixes[AffixCategory.Prefix];
  const percentDamagePrefix = prefixes?.[AffixType.PercentDamage];
  const traitPercentDamageBonus =
    percentDamagePrefix?.equipmentTraits[EquipmentTraitType.DamagePercentage]?.value || 0;
  const finalDamageMultiplier = 1 + traitPercentDamageBonus / 100;

  const suffixes = affixes[AffixCategory.Suffix];
  const flatDamageSuffix = suffixes?.[AffixType.FlatDamage];
  const flatDamageBonus =
    flatDamageSuffix?.equipmentTraits[EquipmentTraitType.FlatDamageAdditive]?.value || 0;

  return new NumberRange(
    Math.floor((damage.min + flatDamageBonus) * finalDamageMultiplier),
    Math.floor((damage.max + flatDamageBonus) * finalDamageMultiplier)
  );
}
