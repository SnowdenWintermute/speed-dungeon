import { INVENTORY_DEFAULT_CAPACITY } from "../app_consts";
import { ERROR_MESSAGES } from "../errors";
import Item from "../items";

export default class Inventory {
  items: Item[] = [];
  capacity: number = INVENTORY_DEFAULT_CAPACITY;
  shards: number = 0;
  constructor() {}

  getItem(itemId: string) {
    let toReturn;
    this.items.forEach((item) => {
      if (item.entityProperties.id === itemId) return (toReturn = item);
    });
    if (toReturn) return toReturn;
    else return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }

  getConsumable() {
    //
  }
}
