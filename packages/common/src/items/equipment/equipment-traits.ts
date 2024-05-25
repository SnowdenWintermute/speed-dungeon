export enum EquipmentTraitType {
  LifeStealPercentage,
  DurabilityBonus,
  ArmorClassPercentage,
  DamagePercentage,
  RandomDamageTypeSelection,
}

export class EquipmentTrait {
  constructor(
    public type: EquipmentTraitType,
    public value: number = 0
  ) {}
}
