import { ConsumableProperties, ConsumableType, formatConsumableType } from ".";
import { Item } from "..";
import { ItemPropertiesType } from "../item-properties";

export default function createConsumableByType(id: string, consumableType: ConsumableType) {
  return new Item(
    { id, name: formatConsumableType(consumableType) },
    1,
    {},
    {
      type: ItemPropertiesType.Consumable,
      consumableProperties: new ConsumableProperties(consumableType, 1),
    }
  );
}
