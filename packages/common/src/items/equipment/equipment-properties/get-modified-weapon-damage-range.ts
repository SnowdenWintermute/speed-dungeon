import { NumberRange } from "../../../primatives/number-range.js";
import { AffixType, Affixes, PrefixType, SuffixType } from "../affixes.js";
import { EquipmentTraitType } from "../equipment-traits/index.js";

export default function getModifiedWeaponDamageRange(
  affixes: Affixes,
  damage: NumberRange
): NumberRange {
  const prefixes = affixes[AffixType.Prefix];
  const percentDamagePrefix = prefixes[PrefixType.PercentDamage];
  const traitPercentDamageBonus =
    percentDamagePrefix?.equipmentTraits[EquipmentTraitType.DamagePercentage]?.value || 0;
  const finalDamageMultiplier = 1 + traitPercentDamageBonus / 100;

  const suffixes = affixes[AffixType.Suffix];
  const flatDamageSuffix = suffixes[SuffixType.Damage];
  const flatDamageBonus =
    flatDamageSuffix?.equipmentTraits[EquipmentTraitType.FlatDamageAdditive]?.value || 0;

  return new NumberRange(
    Math.floor((damage.min + flatDamageBonus) * finalDamageMultiplier),
    Math.floor((damage.max + flatDamageBonus) * finalDamageMultiplier)
  );
}
