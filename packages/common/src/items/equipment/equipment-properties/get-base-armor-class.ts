import { EquipmentType } from "../equipment-types/index.js";
import { Equipment } from "../index.js";

export default function getBaseArmorClass(equipment: Equipment) {
  switch (equipment.equipmentBaseItemProperties.equipmentType) {
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear:
    case EquipmentType.Shield:
      return equipment.equipmentBaseItemProperties.armorClass;
    default:
      return 0;
  }
}
