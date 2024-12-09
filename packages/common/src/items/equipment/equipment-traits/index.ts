import { AffixType, Affixes } from "../affixes.js";

export enum EquipmentTraitType {
  ArmorClassPercentage,
  LifeSteal,
  DamagePercentage,
  FlatDamageAdditive,
}

export interface ArmorClassPercentageTrait {
  equipmentTraitType: EquipmentTraitType.ArmorClassPercentage;
  value: number;
}

export interface DamagePercentageTrait {
  equipmentTraitType: EquipmentTraitType.DamagePercentage;
  value: number;
}

export interface FlatDamageAdditiveTrait {
  equipmentTraitType: EquipmentTraitType.FlatDamageAdditive;
  value: number;
}

export interface LifeStealTrait {
  equipmentTraitType: EquipmentTraitType.LifeSteal;
  value: number;
}

export type EquipmentTrait =
  | ArmorClassPercentageTrait
  | LifeStealTrait
  | DamagePercentageTrait
  | FlatDamageAdditiveTrait;

export function getArmorClassPercentageIncreaseTraitAcModifier(affixes: Affixes) {
  for (const prefix of Object.values(affixes[AffixType.Prefix])) {
    if (prefix.equipmentTraits[EquipmentTraitType.ArmorClassPercentage] !== undefined) {
      return 1.0 + prefix.equipmentTraits[EquipmentTraitType.ArmorClassPercentage].value / 100.0;
    }
  }
  return 1.0;
}

export function getTraitModifiedArmorClass(armorClass: number, affixes: Affixes) {
  return armorClass * getArmorClassPercentageIncreaseTraitAcModifier(affixes);
}
