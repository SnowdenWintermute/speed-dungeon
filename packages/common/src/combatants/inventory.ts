import { immerable } from "immer";
import { INVENTORY_DEFAULT_CAPACITY } from "../app_consts";
import { ERROR_MESSAGES } from "../errors";
import { Item } from "../items";
import { ItemPropertiesType } from "../items/item-properties";

export default class Inventory {
  [immerable] = true;
  items: Item[] = [];
  capacity: number = INVENTORY_DEFAULT_CAPACITY;
  shards: number = 0;
  constructor() {}

  static removeItem(inventory: Inventory, itemId: string) {
    Item.removeFromArray(inventory.items, itemId);
  }

  static getItem(inventory: Inventory, itemId: string) {
    let toReturn: undefined | Item;
    inventory.items.forEach((item) => {
      if (item.entityProperties.id === itemId) {
        toReturn = item;
        return;
      }
    });
    if (toReturn) return toReturn;
    else return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }

  static getConsumableProperties(inventory: Inventory, itemId: string) {
    const item = Inventory.getItem(inventory, itemId);
    if (item instanceof Error) return item;

    switch (item.itemProperties.type) {
      case ItemPropertiesType.Consumable:
        return item.itemProperties.consumableProperties;
      case ItemPropertiesType.Equipment:
        return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    }
  }
}
