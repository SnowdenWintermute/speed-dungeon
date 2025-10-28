import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import { AppStore } from "@/mobx-stores/app-store";
import { observer } from "mobx-react-lite";
import React from "react";

export const InventoryCapacityDisplay = observer(() => {
  const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
  const { combatantProperties } = focusedCharacter;
  const {
    totalItemsInNormalStorage,
    numConsumablesInMinibag,
    minibagCapacity,
    normalStorageCapacity,
  } = combatantProperties.inventory.getCapacityByItemType();

  return (
    <div className="flex flex-col">
      {!!minibagCapacity && (
        <div
          className={`${numConsumablesInMinibag > minibagCapacity ? UNMET_REQUIREMENT_TEXT_COLOR : numConsumablesInMinibag === minibagCapacity ? "text-yellow-400" : ""}`}
        >
          Minibag Capacity: {numConsumablesInMinibag}/{minibagCapacity}
        </div>
      )}
      <div
        className={`${totalItemsInNormalStorage > normalStorageCapacity ? UNMET_REQUIREMENT_TEXT_COLOR : totalItemsInNormalStorage === normalStorageCapacity ? "text-yellow-400" : ""}`}
      >
        Inventory Capacity: {totalItemsInNormalStorage}/{normalStorageCapacity}
      </div>
    </div>
  );
});
