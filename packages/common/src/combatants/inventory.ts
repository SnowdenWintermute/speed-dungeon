import { immerable } from "immer";
import { INVENTORY_DEFAULT_CAPACITY } from "../app-consts.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { Item } from "../items/index.js";
import { Consumable } from "../items/consumables/index.js";
import { Equipment } from "../items/equipment/index.js";
import { plainToInstance } from "class-transformer";

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

  static isAtCapacity(inventory: Inventory) {
    return Inventory.getTotalNumberOfItems(inventory) >= inventory.capacity;
  }

  static insertItem(inventory: Inventory, item: Item) {
    if (Inventory.getTotalNumberOfItems(inventory) > inventory.capacity)
      return new Error(ERROR_MESSAGES.COMBATANT.MAX_INVENTORY_CAPACITY);
    if (item instanceof Consumable) inventory.consumables.push(item);
    else if (item instanceof Equipment) inventory.equipment.push(item);
    else return new Error("Unhandled item type");
  }

  static insertItems(inventory: Inventory, items: Item[]) {
    for (const item of items) {
      const result = Inventory.insertItem(inventory, item);
      if (result instanceof Error) return result;
    }
  }

  static removeItem(inventory: Inventory, itemId: string) {
    let itemResult: Consumable | Equipment | Error = Inventory.removeConsumable(inventory, itemId);
    if (itemResult instanceof Error) {
      itemResult = Inventory.removeEquipment(inventory, itemId);
    }
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

  static getConsumableById(inventory: Inventory, itemId: string) {
    for (const item of Object.values(inventory.consumables)) {
      if (item.entityProperties.id === itemId) {
        return item;
      }
    }
    return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }

  static getEquipmentById(inventory: Inventory, itemId: string) {
    for (const item of Object.values(inventory.equipment)) {
      if (item.entityProperties.id === itemId) {
        return item;
      }
    }
    return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }

  static getItemById(inventory: Inventory, itemId: string) {
    let itemOption: Consumable | Equipment | Error = Inventory.getConsumableById(inventory, itemId);
    if (itemOption instanceof Error) itemOption = Inventory.getEquipmentById(inventory, itemId);
    return itemOption;
  }

  static getItems(inventory: Inventory): Item[] {
    const toReturn: Item[] = [];
    toReturn.push(...inventory.consumables);
    toReturn.push(...inventory.equipment);
    return toReturn;
  }

  static instantiateItemClasses(inventory: Inventory) {
    const consumables: Consumable[] = [];
    const equipments: Equipment[] = [];
    for (const consumable of inventory.consumables) {
      consumables.push(plainToInstance(Consumable, consumable));
    }
    for (const equipment of inventory.equipment) {
      equipments.push(plainToInstance(Equipment, equipment));
    }
    inventory.consumables = consumables;
    inventory.equipment = equipments;
  }
}
