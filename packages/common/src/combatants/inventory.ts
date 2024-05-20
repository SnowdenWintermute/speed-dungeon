import { immerable } from "immer";
import { INVENTORY_DEFAULT_CAPACITY } from "../app_consts";
import { ERROR_MESSAGES } from "../errors";
import Item from "../items";
import { ItemPropertiesType } from "../items/item-properties";

export default class Inventory {
  [immerable] = true;
  items: Item[] = [];
  capacity: number = INVENTORY_DEFAULT_CAPACITY;
  shards: number = 0;
  constructor() {}

  removeItem(itemId: string) {
    Item.removeFromArray(this.items, itemId);
  }

  getItem(itemId: string) {
    let toReturn: undefined | Item;
    this.items.forEach((item) => {
      if (item.entityProperties.id === itemId) {
        toReturn = item;
        return;
      }
    });
    if (toReturn) return toReturn;
    else return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }

  getConsumableProperties(itemId: string) {
    const item = this.getItem(itemId);
    if (item instanceof Error) return item;

    switch (item.itemProperties.type) {
      case ItemPropertiesType.Consumable:
        return item.itemProperties.value;
      case ItemPropertiesType.Equipment:
        return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    }
  }
}
