import { CombatAttribute } from "../../combatants/attributes/index.js";
import { EquipmentTrait, EquipmentTraitType } from "./equipment-traits/index.js";

export enum AffixCategory {
  Prefix,
  Suffix,
}

export enum AffixType {
  Mp,
  ArmorClass,
  Accuracy,
  PercentDamage,
  LifeSteal,
  Evasion,
  ArmorPenetration,
  Agility,
  Strength,
  Spirit,
  Dexterity,
  Vitality,
  AllBase,
  Hp,
  Damage,
  Durability,
  PercentArmorClass,
}

export const PREFIX_TYPES = [
  AffixType.Mp,
  AffixType.ArmorClass,
  AffixType.Accuracy,
  AffixType.PercentDamage,
  AffixType.LifeSteal,
  AffixType.Evasion,
  AffixType.ArmorPenetration,
  AffixType.Agility,
] as const;

export type PrefixType = (typeof PREFIX_TYPES)[number];

export const SUFFIX_TYPES = [
  AffixType.Strength,
  AffixType.Spirit,
  AffixType.Dexterity,
  AffixType.Vitality,
  AffixType.AllBase,
  AffixType.Hp,
  AffixType.Damage,
  AffixType.Durability,
  AffixType.PercentArmorClass,
] as const;

export type SuffixType = (typeof SUFFIX_TYPES)[number];

export type TaggedAffixType =
  | { affixCategory: AffixCategory.Prefix; prefixType: PrefixType }
  | { affixCategory: AffixCategory.Suffix; suffixType: SuffixType };

export interface Affix {
  combatAttributes: Partial<Record<CombatAttribute, number>>;
  equipmentTraits: Partial<Record<EquipmentTraitType, EquipmentTrait>>;
  tier: number;
}

export type Affixes = Record<AffixCategory, Partial<Record<AffixType, Affix>>>;
