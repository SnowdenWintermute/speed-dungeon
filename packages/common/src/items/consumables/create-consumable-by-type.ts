import { ConsumableProperties, ConsumableType, formatConsumableType } from "./index.js";
import { Item } from "../index.js";
import { ItemPropertiesType } from "../item-properties.js";

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
