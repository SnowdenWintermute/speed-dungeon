import { Prefix, PrefixType } from "../affixes";

export function getArmorClassPercentageIncreaseTraitAcModifier(prefixes: Prefix[]) {
  for (const prefix of prefixes) {
    if (prefix.prefixType === PrefixType.ArmorClass) {
      return 1.0 + prefix.value / 100.0;
    }
  }
  return 1.0;
}

export function getTraitModifiedArmorClass(armorClass: number, prefixes: Prefix[]) {
  return armorClass * getArmorClassPercentageIncreaseTraitAcModifier(prefixes);
}
