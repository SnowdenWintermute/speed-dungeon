import { EquipmentType, Jewelry } from "../equipment-types/index.js";

export interface JewelryProperties {
  type: EquipmentType.Ring | EquipmentType.Amulet;
  baseItem: Jewelry.Ring | Jewelry.Amulet;
}
