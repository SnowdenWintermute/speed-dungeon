import { INVENTORY_DEFAULT_CAPACITY } from "../../app-consts.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { Item, ItemType } from "../../items/index.js";
import { Consumable, ConsumableType } from "../../items/consumables/index.js";
import { Equipment } from "../../items/equipment/index.js";
import { plainToInstance } from "class-transformer";
import { EXTRA_CONSUMABLES_STORAGE_PER_TRAIT_LEVEL } from "../combatant-traits/index.js";
import { EntityId } from "../../primatives/index.js";
import { CombatantTraitType } from "../combatant-traits/trait-types.js";
import { runIfInBrowser } from "../../utils/index.js";
import { CombatantSubsystem } from "../combatant-subsystem.js";
import makeAutoObservable from "mobx-store-inheritance";
import { applyEquipmentEffectWhileMaintainingResourcePercentages } from "../combatant-equipment/apply-equipment-affect-while-maintaining-resource-percentages.js";
import { AdventuringParty } from "../../adventuring-party/index.js";

export class Inventory extends CombatantSubsystem {
  consumables: Consumable[] = [];
  equipment: Equipment[] = [];
  capacity: number = INVENTORY_DEFAULT_CAPACITY;
  shards: number = 0;
  constructor() {
    super();
    runIfInBrowser(() => makeAutoObservable(this, {}, { autoBind: true }));
  }

  static getDeserialized(inventory: Inventory) {
    const deserialized = plainToInstance(Inventory, inventory);
    deserialized.instantiateItemClasses();
    return deserialized;
  }

  getTotalNumberOfItems() {
    return this.consumables.length + this.equipment.length;
  }

  getOwnedEquipment() {
    const combatantProperties = this.getCombatantProperties();
    const allEquippedItems = combatantProperties.equipment.getAllEquippedItems({
      includeUnselectedHotswapSlots: true,
    });
    return combatantProperties.inventory.equipment.concat(allEquippedItems);
  }

  isAtCapacity() {
    const combatantProperties = this.getCombatantProperties();
    const { abilityProperties } = combatantProperties;
    const extraConsumableStorageCapacityOption =
      (abilityProperties.getTraitProperties().inherentTraitLevels[
        CombatantTraitType.ExtraConsumablesStorage
      ] || 0) * EXTRA_CONSUMABLES_STORAGE_PER_TRAIT_LEVEL;

    let numItemsToCountTowardCapacity = this.getTotalNumberOfItems();

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

  canPickUpItem(itemType: ItemType) {
    const { totalItemsInNormalStorage, normalStorageCapacity, availableConsumableCapacity } =
      this.getCapacityByItemType();
    if (itemType === ItemType.Consumable && availableConsumableCapacity > 0) {
      return true;
    } else if (totalItemsInNormalStorage < normalStorageCapacity) return true;

    return false;
  }

  dropItem(party: AdventuringParty, itemId: string): Error | EntityId {
    const itemResult = this.removeItem(itemId);
    if (itemResult instanceof Error) return itemResult;
    const item = itemResult;
    const maybeError = party.currentRoom.inventory.insertItem(item);
    if (maybeError instanceof Error) return maybeError;
    return itemId;
  }

  getCapacityByItemType() {
    const { abilityProperties } = this.getCombatantProperties();
    const extraConsumableCapacityOption =
      (abilityProperties.getTraitProperties().inherentTraitLevels[
        CombatantTraitType.ExtraConsumablesStorage
      ] || 0) * EXTRA_CONSUMABLES_STORAGE_PER_TRAIT_LEVEL;
    let minibagCapacity = 0;
    if (extraConsumableCapacityOption) minibagCapacity = extraConsumableCapacityOption;

    const totalNumItemsInInventory = this.getTotalNumberOfItems();

    // if minibag
    const totalNumConsumables = this.consumables.length;
    const numConsumablesInMinibag = Math.min(minibagCapacity, totalNumConsumables);
    const numConsumablesInNormalStorage = totalNumConsumables - numConsumablesInMinibag;
    const totalItemsInNormalStorage = numConsumablesInNormalStorage + this.equipment.length;
    const normalStorageCapacity = INVENTORY_DEFAULT_CAPACITY;
    const availableCapacity = normalStorageCapacity - totalItemsInNormalStorage;
    const availableConsumableCapacity =
      minibagCapacity - numConsumablesInMinibag + availableCapacity;

    return {
      totalNumItemsInInventory,
      availableConsumableCapacity,
      numConsumablesInMinibag,
      minibagCapacity,
      availableCapacity,
      normalStorageCapacity,
      totalItemsInNormalStorage,
      totalNumConsumables,
    };
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

  removeItem(itemId: string) {
    let itemResult: Consumable | Equipment | Error = this.removeConsumable(itemId);
    if (itemResult instanceof Error) {
      itemResult = this.removeEquipment(itemId);
    }
    return itemResult;
  }

  removeEquipment(itemId: string): Error | Equipment {
    let itemOption = Item.removeFromArray(this.equipment, itemId);
    if (itemOption === undefined) return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
    if (!(itemOption instanceof Equipment)) return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    else return itemOption;
  }

  removeConsumable(itemId: string): Error | Consumable {
    let itemOption = Item.removeFromArray(this.consumables, itemId);
    if (itemOption === undefined) return new Error(ERROR_MESSAGES.ITEM.NOT_FOUND);
    if (!(itemOption instanceof Consumable)) return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    else return itemOption;
  }

  getConsumableByTypeAndLevel(consumableType: ConsumableType, level: number) {
    for (const item of Object.values(this.consumables)) {
      if (item.consumableType === consumableType && item.itemLevel === level) {
        return item;
      }
    }
  }

  getOwnedItemById(itemId: EntityId) {
    const ownedEquipment = this.getOwnedEquipment();
    for (const equipment of ownedEquipment) {
      if (equipment.entityProperties.id === itemId) return equipment;
    }
    const items = this.getItems();
    for (const item of items) {
      if (item.entityProperties.id === itemId) return item;
    }
    return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }

  removeOwnedItem(itemId: EntityId) {
    let removedItemResult = this.removeItem(itemId);

    if (removedItemResult instanceof Error) {
      const combatantProperties = this.getCombatantProperties();
      applyEquipmentEffectWhileMaintainingResourcePercentages(combatantProperties, () => {
        removedItemResult = combatantProperties.equipment.removeItem(itemId);
      });
    }
    return removedItemResult;
  }

  getConsumableById(itemId: string) {
    for (const item of Object.values(this.consumables)) {
      if (item.entityProperties.id === itemId) {
        return item;
      }
    }
    return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }

  getEquipmentById(itemId: string) {
    for (const item of Object.values(this.equipment)) {
      if (item.entityProperties.id === itemId) {
        return item;
      }
    }
    return new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }

  getItemById(itemId: string) {
    let itemOption: Consumable | Equipment | Error = this.getConsumableById(itemId);
    if (itemOption instanceof Error) itemOption = this.getEquipmentById(itemId);
    return itemOption;
  }

  getItems(): Item[] {
    const toReturn: Item[] = [];
    toReturn.push(...this.consumables);
    toReturn.push(...this.equipment);
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

  getSelectedSkillBook(itemIdSelectedOption: null | EntityId): Error | Consumable {
    if (!itemIdSelectedOption) return new Error("No item selected");
    const itemResult = this.getItemById(itemIdSelectedOption);
    if (itemResult instanceof Error) return itemResult;
    if (!(itemResult instanceof Consumable)) return new Error("Item is not a consumable");
    if (!Consumable.isSkillBook(itemResult.consumableType))
      return new Error("Item is not a skill book");
    return itemResult;
  }
}
