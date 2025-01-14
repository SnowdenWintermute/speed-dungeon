import { AmuletBaseItemType, EquipmentType, RingBaseItemType } from "../equipment-types/index.js";

export interface JewelryProperties {
  taggedBaseEquipment: RingBaseItemType | AmuletBaseItemType;
  equipmentType: EquipmentType.Ring | EquipmentType.Amulet;
}
