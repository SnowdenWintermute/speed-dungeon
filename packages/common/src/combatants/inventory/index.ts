import { INVENTORY_DEFAULT_CAPACITY } from "../../app-consts.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { Item, ItemType } from "../../items/index.js";
import { Consumable, ConsumableType } from "../../items/consumables/index.js";
import { Equipment, TaggedEquipmentSlot } from "../../items/equipment/index.js";
import { plainToInstance } from "class-transformer";
import { EXTRA_CONSUMABLES_STORAGE_PER_TRAIT_LEVEL } from "../combatant-traits/index.js";
import { EntityId } from "../../primatives/index.js";
import { CombatantTraitType } from "../combatant-traits/trait-types.js";
import { runIfInBrowser } from "../../utils/index.js";
import { CombatantSubsystem } from "../combatant-subsystem.js";
import makeAutoObservable from "mobx-store-inheritance";
import { AdventuringParty } from "../../adventuring-party/index.js";

export class Inventory extends CombatantSubsystem {
  consumables: Consumable[] = [];
  equipment: Equipment[] = [];
  capacity: number = INVENTORY_DEFAULT_CAPACITY;
  shards: number = 0;
  constructor() {
    super();
    runIfInBrowser(() => makeAutoObservable(this, {}));
  }

  static getDeserialized(inventory: Inventory) {
    const deserialized = plainToInstance(Inventory, inventory);
    deserialized.instantiateItemClasses();
    return deserialized;
  }

  private instantiateItemClasses() {
    const consumables: Consumable[] = [];
    const equipments: Equipment[] = [];
    for (const consumable of this.consumables) {
      consumables.push(plainToInstance(Consumable, consumable));
    }
    for (const equipment of this.equipment) {
      equipments.push(Equipment.getDeserialized(equipment));
    }
    this.consumables = consumables;
    this.equipment = equipments;
  }

  getItemsCount() {
    return this.consumables.length + this.equipment.length;
  }

  isAtCapacity() {
    const { availableCapacity, availableConsumableCapacity } = this.getCapacityByItemType();
    return availableConsumableCapacity <= 0 && availableCapacity <= 0;
  }

  canPickUpItem(itemType: ItemType) {
    const { itemsInNormalStorageCount, normalStorageCapacity, availableConsumableCapacity } =
      this.getCapacityByItemType();
    if (itemType === ItemType.Consumable && availableConsumableCapacity > 0) {
      return true;
    } else if (itemsInNormalStorageCount < normalStorageCapacity) return true;

    return false;
  }

  getCapacityByItemType() {
    const { abilityProperties } = this.getCombatantProperties();
    const extraConsumableCapacityOption =
      (abilityProperties.getTraitProperties().inherentTraitLevels[
        CombatantTraitType.ExtraConsumablesStorage
      ] || 0) * EXTRA_CONSUMABLES_STORAGE_PER_TRAIT_LEVEL;
    const minibagCapacity = extraConsumableCapacityOption || 0;

    const totalItemsCount = this.getItemsCount();

    const consumablesTotalCount = this.consumables.length;
    const consumablesInMinibagCount = Math.min(minibagCapacity, consumablesTotalCount);
    const consumablesInNormalStorageCount = consumablesTotalCount - consumablesInMinibagCount;
    const itemsInNormalStorageCount = consumablesInNormalStorageCount + this.equipment.length;
    const normalStorageCapacity = INVENTORY_DEFAULT_CAPACITY;
    const availableCapacity = normalStorageCapacity - itemsInNormalStorageCount;
    const availableConsumableCapacity =
      minibagCapacity - consumablesInMinibagCount + availableCapacity;

    return {
      totalItemsCount,
      availableConsumableCapacity,
      consumablesInMinibagCount,
      minibagCapacity,
      availableCapacity,
      normalStorageCapacity,
      itemsInNormalStorageCount,
      consumablesTotalCount,
    };
  }

  dropItem(party: AdventuringParty, itemId: string): Error | EntityId {
    const itemResult = this.removeItem(itemId);
    if (itemResult instanceof Error) return itemResult;
    const item = itemResult;
    const maybeError = party.currentRoom.inventory.insertItem(item);
    if (maybeError instanceof Error) return maybeError;
    return itemId;
  }

  dropEquippedItem(party: AdventuringParty, taggedSlot: TaggedEquipmentSlot): Error | EntityId {
    const combatantProperties = this.getCombatantProperties();
    const itemIdsUnequipped = combatantProperties.equipment.unequipSlots([taggedSlot]);
    const itemId = itemIdsUnequipped[0];
    if (itemId === undefined) return new Error(ERROR_MESSAGES.EQUIPMENT.NO_ITEM_EQUIPPED);
    const itemDroppedIdResult = combatantProperties.inventory.dropItem(party, itemId);
    if (itemDroppedIdResult instanceof Error) return itemDroppedIdResult;
    return itemId;
  }

  insertItem(item: Item): Error | void {
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
    const itemOption = this.consumables.find(
      (item) => item.consumableType === consumableType && item.itemLevel === level
    );
    return itemOption;
  }

  getOwnedEquipment() {
    const combatantProperties = this.getCombatantProperties();
    const allEquippedItems = combatantProperties.equipment.getAllEquippedItems({
      includeUnselectedHotswapSlots: true,
    });
    return combatantProperties.inventory.equipment.concat(allEquippedItems);
  }

  getStoredOrEquipped(itemId: EntityId) {
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

  removeStoredOrEquipped(itemId: EntityId) {
    let removedItemResult = this.removeItem(itemId);

    if (removedItemResult instanceof Error) {
      const combatantProperties = this.getCombatantProperties();
      combatantProperties.resources.maintainResourcePercentagesAfterEffect(() => {
        removedItemResult = combatantProperties.equipment.removeItem(itemId);
      });
    }
    return removedItemResult;
  }

  getConsumableById(itemId: string) {
    const item = this.consumables.find((i) => i.entityProperties.id === itemId);
    return item ?? new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
  }

  getEquipmentById(itemId: string) {
    const item = this.equipment.find((i) => i.entityProperties.id === itemId);
    return item ?? new Error(ERROR_MESSAGES.ITEM.NOT_OWNED);
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

  getAllOwned() {
    return [...this.getOwnedEquipment(), ...this.consumables];
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

  changeShards(value: number) {
    this.shards += value;
  }

  canAffordShardPrice(price: number) {
    return price <= this.shards;
  }
}
