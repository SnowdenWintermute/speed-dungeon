import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import {
  CombatantProperties,
  CombatantTraitType,
  INVENTORY_DEFAULT_CAPACITY,
  Inventory,
} from "@speed-dungeon/common";
import React from "react";

export default function InventoryCapacityDisplay({
  combatantProperties,
}: {
  combatantProperties: CombatantProperties;
}) {
  const numItemsInInventory = Inventory.getTotalNumberOfItems(combatantProperties.inventory);
  let consumableSpecificCapacity;

  const extraConsumableStorageTraitOption = combatantProperties.traits.find(
    (trait) => trait.type === CombatantTraitType.ExtraConsumablesStorage
  );

  let numItemsToCountTowardCapacity = Inventory.getTotalNumberOfItems(
    combatantProperties.inventory
  );

  let numConsumablesToDeductFromCapacityCheck;

  if (
    extraConsumableStorageTraitOption &&
    extraConsumableStorageTraitOption.type === CombatantTraitType.ExtraConsumablesStorage
  ) {
    const numConsumables = combatantProperties.inventory.consumables.length;
    consumableSpecificCapacity = extraConsumableStorageTraitOption.capacity;

    numConsumablesToDeductFromCapacityCheck = Math.min(
      numConsumables,
      extraConsumableStorageTraitOption.capacity
    );
    numItemsToCountTowardCapacity -= numConsumablesToDeductFromCapacityCheck;
  }

  return (
    <div className="flex flex-col">
      {consumableSpecificCapacity && numConsumablesToDeductFromCapacityCheck !== undefined && (
        <div>
          Minibag Capacity: {numConsumablesToDeductFromCapacityCheck} / {consumableSpecificCapacity}
        </div>
      )}
      <div
        className={`${numItemsInInventory - numItemsToCountTowardCapacity > INVENTORY_DEFAULT_CAPACITY ? UNMET_REQUIREMENT_TEXT_COLOR : ""}`}
      >
        Inventory Capacity: {numItemsToCountTowardCapacity}/{INVENTORY_DEFAULT_CAPACITY}
      </div>
    </div>
  );
}
