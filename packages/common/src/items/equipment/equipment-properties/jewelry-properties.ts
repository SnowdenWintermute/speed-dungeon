import { EquipmentType } from "../equipment-types/index.js";

export interface JewelryProperties {
  type: EquipmentType.Ring | EquipmentType.Amulet;
  baseItem: null
}
