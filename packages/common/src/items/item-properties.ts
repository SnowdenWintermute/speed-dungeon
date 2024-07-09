import { ConsumableProperties, ConsumableType } from "./consumables";
import { EquipmentBaseItem, EquipmentType } from "./equipment";
import { EquipmentProperties } from "./equipment/equipment-properties";

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
