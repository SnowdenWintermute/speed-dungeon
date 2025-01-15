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
