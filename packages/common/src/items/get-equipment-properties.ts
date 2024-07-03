import { EquipmentProperties, Item, ItemPropertiesType } from ".";
import { ERROR_MESSAGES } from "../errors";

export default function getEquipmentProperties(item: Item): Error | EquipmentProperties {
  if (item.itemProperties.type === ItemPropertiesType.Consumable)
    return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
  return item.itemProperties.equipmentProperties;
}
