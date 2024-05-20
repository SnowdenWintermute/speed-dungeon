export enum AffixType {
  Prefix,
  Suffix,
}

export enum PrefixType {
  Mp,
  ArmorClass,
  Accuracy,
  PercentDamage,
  LifeSteal,
  Resilience,
  Evasion,
  ArmorPenetration,
  Agility,
  Focus,
}

export enum SuffixType {
  Strength,
  Intelligence,
  Dexterity,
  Vitality,
  AllBase,
  Hp,
  Damage,
  Durability,
}

interface Prefix {
  affixType: AffixType.Prefix;
  prefixType: PrefixType;
  value: number;
}

interface Suffix {
  affixType: AffixType.Suffix;
  suffixType: SuffixType;
  value: number;
}

export type Affix = Prefix | Suffix;
