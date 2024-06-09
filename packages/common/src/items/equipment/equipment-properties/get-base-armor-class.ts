import { EquipmentProperties } from ".";
import { EquipmentType } from "../equipment-types";

export default function getBaseArmorClass(equipmentProperties: EquipmentProperties) {
  switch (equipmentProperties.equipmentTypeProperties.type) {
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear:
    case EquipmentType.Shield:
      return equipmentProperties.equipmentTypeProperties.armorClass;
    default:
      return 0;
  }
}
