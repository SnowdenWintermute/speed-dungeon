import { EquipmentType, Item, ItemPropertiesType, WeaponProperties } from ".";
import { ERROR_MESSAGES } from "../errors/index.js";

export function getWeaponProperties(item: Item): Error | WeaponProperties {
  if (item.itemProperties.type !== ItemPropertiesType.Equipment)
    return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
  const equipmentPropertiesOption = item.itemProperties.equipmentProperties;

  switch (equipmentPropertiesOption.equipmentBaseItemProperties.type) {
    case EquipmentType.OneHandedMeleeWeapon:
    case EquipmentType.TwoHandedMeleeWeapon:
    case EquipmentType.TwoHandedRangedWeapon:
      return equipmentPropertiesOption.equipmentBaseItemProperties;
    default:
      return new Error(ERROR_MESSAGES.EQUIPMENT.INVALID_TYPE);
  }
}
