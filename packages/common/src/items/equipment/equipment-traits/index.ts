import { AffixType, Affixes } from "../affixes";

export enum EquipmentTraitType {
  ArmorClassPercentage,
  LifeSteal,
  DamagePercentage,
}

export interface ArmorClassPercentageTrait {
  equipmentTraitType: EquipmentTraitType.ArmorClassPercentage;
  percentage: number;
}

export interface DamagePercentageTrait {
  equipmentTraitType: EquipmentTraitType.DamagePercentage;
  percentage: number;
}

export interface LifeStealTrait {
  equipmentTraitType: EquipmentTraitType.LifeSteal;
  percentage: number;
}

export type EquipmentTrait = ArmorClassPercentageTrait | LifeStealTrait | DamagePercentageTrait;

export function getArmorClassPercentageIncreaseTraitAcModifier(affixes: Affixes) {
  for (const prefix of Object.values(affixes[AffixType.Prefix])) {
    if (prefix.equipmentTraits[EquipmentTraitType.ArmorClassPercentage] !== undefined) {
      return (
        1.0 + prefix.equipmentTraits[EquipmentTraitType.ArmorClassPercentage].percentage / 100.0
      );
    }
  }
  return 1.0;
}

export function getTraitModifiedArmorClass(armorClass: number, affixes: Affixes) {
  return armorClass * getArmorClassPercentageIncreaseTraitAcModifier(affixes);
}
