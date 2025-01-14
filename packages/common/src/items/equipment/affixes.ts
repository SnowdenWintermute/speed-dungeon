import { CombatAttribute } from "../../attributes/index.js";
import { EquipmentTrait, EquipmentTraitType } from "./equipment-traits/index.js";

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
  PercentArmorClass,
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
  [AffixType.Prefix]: Partial<Record<PrefixType, Affix>>;
  [AffixType.Suffix]: Partial<Record<SuffixType, Affix>>;
};
