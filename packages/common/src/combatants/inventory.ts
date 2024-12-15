import { immerable } from "immer";
import { INVENTORY_DEFAULT_CAPACITY } from "../app-consts.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { Consumable, Equipment, Item } from "../items/index.js";

export class Inventory {
  [immerable] = true;
  consumables: Consumable[] = [];
  equipment: Equipment[] = [];
  capacity: number = INVENTORY_DEFAULT_CAPACITY;
  shards: number = 0;
  constructor() {}

  static getTotalNumberOfItems(inventory: Inventory) {
    return inventory.consumables.length + inventory.equipment.length;
  }

  static insertItem(inventory: Inventory, item: Item) {
    if (Inventory.getTotalNumberOfItems(inventory) > inventory.capacity)
      return new Error(ERROR_MESSAGES.COMBATANT.MAX_INVENTORY_CAPACITY);
    if (item instanceof Consumable) inventory.consumables.push(item);
    else if (item instanceof Equipment) inventory.equipment.push(item);
    else return new Error("Unhandled item type");
  }

  static removeItem(inventory: Inventory, itemId: string) {
    let itemResult: Consumable | Equipment | Error = Inventory.removeConsumable(inventory, itemId);
    if (itemResult instanceof Error) itemResult = Inventory.removeEquipment(inventory, itemId);
    return itemResult;
  }

  static removeEquipment(inventory: Inventory, itemId: string): Error | Equipment {
    let itemOption = Item.removeFromArray(inventory.equipment, itemId);
    if (itemOption === undefined) return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
    if (!(itemOption instanceof Equipment)) return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    else return itemOption;
  }

  static removeConsumable(inventory: Inventory, itemId: string): Error | Consumable {
    let itemOption = Item.removeFromArray(inventory.consumables, itemId);
    if (itemOption === undefined) return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
    if (!(itemOption instanceof Consumable)) return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    else return itemOption;
  }

  static getConsumable(inventory: Inventory, itemId: string) {
    for (const item of Object.values(inventory.consumables)) {
      if (item.entityProperties.id === itemId) {
        return item;
      }
    }
    return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }

  static getEquipment(inventory: Inventory, itemId: string) {
    for (const item of Object.values(inventory.equipment)) {
      if (item.entityProperties.id === itemId) {
        return item;
      }
    }
    return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }

  static getItem(inventory: Inventory, itemId: string) {
    let itemOption: Consumable | Equipment | Error = Inventory.getConsumable(inventory, itemId);
    if (itemOption instanceof Error) itemOption = Inventory.getEquipment(inventory, itemId);
    return itemOption;
  }
}
