import { EquipmentTrait, EquipmentTraitType } from "../equipment-traits";

export function getArmorClassPercentageIncreaseTraitAcModifier(equipmentTraits: EquipmentTrait[]) {
  for (const trait of equipmentTraits) {
    if (trait.type === EquipmentTraitType.ArmorClassPercentage) {
      return 1.0 + trait.value / 100.0;
    }
  }
  return 1.0;
}

export function getTraitModifiedArmorClass(armorClass: number, equipmentTraits: EquipmentTrait[]) {
  return armorClass * getArmorClassPercentageIncreaseTraitAcModifier(equipmentTraits);
}
