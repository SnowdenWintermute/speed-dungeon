import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import {
  CombatantProperties,
  CombatantTraitType,
  INVENTORY_DEFAULT_CAPACITY,
  Inventory,
  getCapacityByItemType,
} from "@speed-dungeon/common";
import React from "react";

export default function InventoryCapacityDisplay({
  combatantProperties,
}: {
  combatantProperties: CombatantProperties;
}) {
  const {
    totalItemsInNormalStorage,
    totalNumItemsInInventory,
    availableConsumableCapacity,
    numConsumablesInMinibag,
    minibagCapacity,
    availableCapacity,
    normalStorageCapacity,
  } = getCapacityByItemType(combatantProperties);

  return (
    <div className="flex flex-col">
      {!!minibagCapacity && (
        <div>
          Minibag Capacity: {numConsumablesInMinibag} / {minibagCapacity}
        </div>
      )}
      <div
        className={`${totalItemsInNormalStorage > normalStorageCapacity ? UNMET_REQUIREMENT_TEXT_COLOR : ""}`}
      >
        Inventory Capacity: {totalItemsInNormalStorage}/{normalStorageCapacity}
        {JSON.stringify({
          totalItemsInNormalStorage,
          totalNumItemsInInventory,
          availableConsumableCapacity,
          numConsumablesInMinibag,
          minibagCapacity,
          availableCapacity,
          normalStorageCapacity,
        })}
      </div>
    </div>
  );
}
