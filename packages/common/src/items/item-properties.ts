import { ConsumableProperties } from "./consumables";
import EquipmentProperties from "./equipment/equipment-properties";

export enum ItemPropertiesType {
  Equipment,
  Consumable,
}

interface EquipmentItemProperties {
  type: ItemPropertiesType.Equipment;
  value: EquipmentProperties;
}

interface ConsumableItemProperties {
  type: ItemPropertiesType.Consumable;
  value: ConsumableProperties;
}

export type ItemProperties = EquipmentItemProperties | ConsumableItemProperties;
