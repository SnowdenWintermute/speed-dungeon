import { CombatAttribute } from "../../combatants";
import { EquipmentTrait, EquipmentTraitType } from "./equipment-traits";

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

export type TaggedAffixType =
  | { affixType: AffixType.Prefix; prefixType: PrefixType }
  | { affixType: AffixType.Suffix; suffixType: SuffixType };

export interface Affix {
  combatAttributes: Partial<Record<CombatAttribute, number>>;
  equipmentTraits: Partial<Record<EquipmentTraitType, EquipmentTrait>>;
  tier: number;
}

export type Affixes = {
  prefixes: Partial<Record<PrefixType, Affix>>;
  suffixes: Partial<Record<SuffixType, Affix>>;
};
