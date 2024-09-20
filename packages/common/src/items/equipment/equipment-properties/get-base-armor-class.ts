import { EquipmentProperties } from "./index.js";
import { EquipmentType } from "../equipment-types/index.js";

export default function getBaseArmorClass(equipmentProperties: EquipmentProperties) {
  switch (equipmentProperties.equipmentBaseItemProperties.type) {
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear:
    case EquipmentType.Shield:
      return equipmentProperties.equipmentBaseItemProperties.armorClass;
    default:
      return 0;
  }
}
