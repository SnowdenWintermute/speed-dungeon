import { INVENTORY_DEFAULT_CAPACITY } from "../../app-consts.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { Item } from "../../items/index.js";
import { Consumable, ConsumableType } from "../../items/consumables/index.js";
import { Equipment } from "../../items/equipment/index.js";
import { plainToInstance } from "class-transformer";
import { EXTRA_CONSUMABLES_STORAGE_PER_TRAIT_LEVEL } from "../combatant-traits/index.js";
import { getCapacityByItemType } from "./can-pick-up-item.js";
import { EntityId } from "../../primatives/index.js";
import { makeAutoObservable } from "mobx";
import { CombatantProperties } from "../combatant-properties.js";
import { CombatantTraitType } from "../combatant-traits/trait-types.js";

export class Inventory {
  consumables: Consumable[] = [];
  equipment: Equipment[] = [];
  capacity: number = INVENTORY_DEFAULT_CAPACITY;
  shards: number = 0;
  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  static getDeserialized(inventory: Inventory) {
    const deserialized = plainToInstance(Inventory, inventory);
    deserialized.instantiateItemClasses();
    return deserialized;
  }

  static getTotalNumberOfItems(inventory: Inventory) {
    return inventory.consumables.length + inventory.equipment.length;
  }

  static getCapacityByItemType = getCapacityByItemType;

  static isAtCapacity(combatantProperties: CombatantProperties) {
    const extraConsumableStorageCapacityOption =
      (combatantProperties.abilityProperties.getTraitProperties().inherentTraitLevels[
        CombatantTraitType.ExtraConsumablesStorage
      ] || 0) * EXTRA_CONSUMABLES_STORAGE_PER_TRAIT_LEVEL;

    let numItemsToCountTowardCapacity = Inventory.getTotalNumberOfItems(
      combatantProperties.inventory
    );

    if (extraConsumableStorageCapacityOption) {
      const numConsumables = combatantProperties.inventory.consumables.length;
      const numConsumablesToDeductFromCapacityCheck = Math.min(
        numConsumables,
        extraConsumableStorageCapacityOption
      );
      numItemsToCountTowardCapacity -= numConsumablesToDeductFromCapacityCheck;
    }

    return numItemsToCountTowardCapacity >= combatantProperties.inventory.capacity;
  }

  insertItem(item: Item) {
    if (item instanceof Consumable) this.consumables.push(item);
    else if (item instanceof Equipment) this.equipment.push(item);
    else return new Error("Unhandled item type");
  }

  insertItems(items: Item[]) {
    for (const item of items) {
      const result = this.insertItem(item);
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

  static getConsumableByTypeAndLevel(
    inventory: Inventory,
    consumableType: ConsumableType,
    level: number
  ) {
    for (const item of Object.values(inventory.consumables)) {
      if (item.consumableType === consumableType && item.itemLevel === level) {
        return item;
      }
    }
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

  instantiateItemClasses() {
    const consumables: Consumable[] = [];
    const equipments: Equipment[] = [];
    for (const consumable of this.consumables) {
      consumables.push(plainToInstance(Consumable, consumable));
    }
    for (const equipment of this.equipment) {
      equipments.push(plainToInstance(Equipment, equipment));
    }
    this.consumables = consumables;
    this.equipment = equipments;
  }

  static getSelectedSkillBook(
    inventory: Inventory,
    itemIdSelectedOption: null | EntityId
  ): Error | Consumable {
    if (!itemIdSelectedOption) return new Error("No item selected");
    const itemResult = Inventory.getItemById(inventory, itemIdSelectedOption);
    if (itemResult instanceof Error) return itemResult;
    if (!(itemResult instanceof Consumable)) return new Error("Item is not a consumable");
    if (!Consumable.isSkillBook(itemResult.consumableType))
      return new Error("Item is not a skill book");
    return itemResult;
  }
}
