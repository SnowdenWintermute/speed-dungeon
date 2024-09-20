import { ConsumableProperties, ConsumableType } from "./consumables/index.js";
import { EquipmentBaseItem, EquipmentType } from "./equipment/index.js";
import { EquipmentProperties } from "./equipment/equipment-properties/index.js";

export enum ItemPropertiesType {
  Equipment,
  Consumable,
}

export type BaseItem =
  | ConsumableType
  | { equipmentType: EquipmentType; baseEquipmentItem: EquipmentBaseItem };

interface EquipmentItemProperties {
  type: ItemPropertiesType.Equipment;
  equipmentProperties: EquipmentProperties;
}

interface ConsumableItemProperties {
  type: ItemPropertiesType.Consumable;
  consumableProperties: ConsumableProperties;
}

export type ItemProperties = EquipmentItemProperties | ConsumableItemProperties;
