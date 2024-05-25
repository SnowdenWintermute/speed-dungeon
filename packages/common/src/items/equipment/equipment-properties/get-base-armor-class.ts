import EquipmentProperties from ".";
import { EquipmentType } from "../equipment-types";

export default function getBaseArmorClass(this: EquipmentProperties) {
  switch (this.equipmentTypeProperties.type) {
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear:
    case EquipmentType.Shield:
      return this.equipmentTypeProperties.armorClass;
    default:
      return 0;
  }
}
