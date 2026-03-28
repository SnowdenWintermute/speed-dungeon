import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client-consts";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import React from "react";

export const InventoryCapacityDisplay = observer(() => {
  const clientApplication = useClientApplication();
  const { combatantFocus } = clientApplication;
  const focusedCharacter = combatantFocus.requireFocusedCharacter();
  const { combatantProperties } = focusedCharacter;
  const {
    itemsInNormalStorageCount,
    consumablesInMinibagCount,
    minibagCapacity,
    normalStorageCapacity,
  } = combatantProperties.inventory.getCapacityByItemType();

  return (
    <div className="flex flex-col">
      {!!minibagCapacity && (
        <div
          className={`${consumablesInMinibagCount > minibagCapacity ? UNMET_REQUIREMENT_TEXT_COLOR : consumablesInMinibagCount === minibagCapacity ? "text-yellow-400" : ""}`}
        >
          Minibag Capacity: {consumablesInMinibagCount}/{minibagCapacity}
        </div>
      )}
      <div
        className={`${itemsInNormalStorageCount > normalStorageCapacity ? UNMET_REQUIREMENT_TEXT_COLOR : itemsInNormalStorageCount === normalStorageCapacity ? "text-yellow-400" : ""}`}
      >
        Inventory Capacity: {itemsInNormalStorageCount}/{normalStorageCapacity}
      </div>
    </div>
  );
});
