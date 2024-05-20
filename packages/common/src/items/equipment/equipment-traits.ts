import { EquipmentType } from "./equipment-types";

export enum EquipmentTraitType {
  LifeStealPercentage,
  DurabilityBonus,
  ArmorClassPercentage,
  DamagePercentage,
  RandomDamageTypeSelection,
}

export class EquipmentTrait {
  constructor(
    public type: EquipmentType,
    public value: number = 0
  ) {}
}
