import { ConsumableProperties } from "./consumables";
import { EquipmentProperties } from "./equipment/equipment-properties";

export enum ItemPropertiesType {
  Equipment,
  Consumable,
}

interface EquipmentItemProperties {
  type: ItemPropertiesType.Equipment;
  equipmentProperties: EquipmentProperties;
}

interface ConsumableItemProperties {
  type: ItemPropertiesType.Consumable;
  consumableProperties: ConsumableProperties;
}

export type ItemProperties = EquipmentItemProperties | ConsumableItemProperties;
