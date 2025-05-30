import { ItemType } from "../../items/index.js";
import { INVENTORY_DEFAULT_CAPACITY } from "../../app-consts.js";
import { CombatantProperties } from "../index.js";
import { CombatantTraitType } from "../combatant-traits/index.js";
import { Inventory } from "./index.js";

export function canPickUpItem(combatantProperties: CombatantProperties, itemType: ItemType) {
  const { totalItemsInNormalStorage, normalStorageCapacity, availableConsumableCapacity } =
    getCapacityByItemType(combatantProperties);
  if (itemType === ItemType.Consumable && availableConsumableCapacity > 0) {
    return true;
  } else if (totalItemsInNormalStorage < normalStorageCapacity) return true;

  return false;
}

export function getCapacityByItemType(combatantProperties: CombatantProperties) {
  const extraConsumableStorageTraitOption = combatantProperties.traits.find(
    (trait) => trait.type === CombatantTraitType.ExtraConsumablesStorage
  );
  let minibagCapacity = 0;
  if (extraConsumableStorageTraitOption?.type === CombatantTraitType.ExtraConsumablesStorage) {
    minibagCapacity = extraConsumableStorageTraitOption.capacity;
  }

  const { inventory } = combatantProperties;

  const totalNumItemsInInventory = Inventory.getTotalNumberOfItems(combatantProperties.inventory);

  // if minibag
  // - get total num consumables
  const totalNumConsumables = inventory.consumables.length;
  // - calculate numConsumablesInMinibag as Math.min(minibagCapacity, totalNumConsumables)
  const numConsumablesInMinibag = Math.min(minibagCapacity, totalNumConsumables);
  // - calculate numConsumablesInNormalStorage as totalNumConsumables - numConsumablesInMinibag
  const numConsumablesInNormalStorage = totalNumConsumables - numConsumablesInMinibag;
  // - calculate totalItemsInNormalStorage as numConsumablesInNormalStorage + inventory.equipment.length
  const totalItemsInNormalStorage = numConsumablesInNormalStorage + inventory.equipment.length;
  // - define normalStorageCapacity as DEFAULT_INVENTORY_CAPACITY
  const normalStorageCapacity = INVENTORY_DEFAULT_CAPACITY;
  // - define availableCapacity as normalStorageCapacity - totalItemsInNormalStorage
  const availableCapacity = normalStorageCapacity - totalItemsInNormalStorage;
  // - calculate "consumable capacity" as (minibagCapacity - numConsumablesInMinibag) + availableCapacity
  const availableConsumableCapacity = minibagCapacity - numConsumablesInMinibag + availableCapacity;

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
