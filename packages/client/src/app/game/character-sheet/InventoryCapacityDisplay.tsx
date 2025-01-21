import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import { useGameStore } from "@/stores/game-store";
import { Inventory } from "@speed-dungeon/common";
import React from "react";

export default function InventoryCapacityDisplay() {
  const focusedCharacterResult = useGameStore().getFocusedCharacter();

  if (focusedCharacterResult instanceof Error) return <></>;
  const { combatantProperties } = focusedCharacterResult;
  const {
    totalItemsInNormalStorage,
    numConsumablesInMinibag,
    minibagCapacity,
    normalStorageCapacity,
  } = Inventory.getCapacityByItemType(combatantProperties);

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
}
