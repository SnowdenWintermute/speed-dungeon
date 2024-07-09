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

export interface Prefix {
  affixType: AffixType.Prefix;
  prefixType: PrefixType;
  value: number;
  tier: number;
}

export interface Suffix {
  affixType: AffixType.Suffix;
  suffixType: SuffixType;
  value: number;
  tier: number;
}

export type Affixes = {
  prefixes: Prefix[];
  suffixes: Suffix[];
};

export type Affix = Prefix | Suffix;
