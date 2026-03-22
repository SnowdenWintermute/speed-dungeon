import React, { useState } from "react";
import BackpackIcon from "../../../../public/img/game-ui-icons/backpack.svg";
import { CombatantId, INVENTORY_DEFAULT_CAPACITY } from "@speed-dungeon/common";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client-consts";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import { InventoryItemsActionMenuScreen } from "@/client-application/action-menu/screens/items-in-inventory";

export const InventoryIconButton = observer(
  ({ entityId, numItemsInInventory }: { entityId: CombatantId; numItemsInInventory: number }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <button
        className="absolute -bottom-1 -left-1 p-1 h-8 w-8 bg-slate-700 border border-slate-400"
        onMouseEnter={() => {
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        onClick={() => {
          const clientApplication = useClientApplication();
          const { actionMenu, combatantFocus } = clientApplication;

          combatantFocus.setFocusedCharacter(entityId);

          const shouldShowCharacterSheet = actionMenu.shouldShowCharacterSheet();
          if (shouldShowCharacterSheet) {
            // happens if you click inventory button on a character that was already
            // focused and was already in inventory
            actionMenu.clearStack();
          } else {
            actionMenu.pushStack(new InventoryItemsActionMenuScreen(clientApplication));
          }
        }}
      >
        <BackpackIcon className="fill-slate-400 h-full w-full pointer-events-none" />
        <div
          className={`text-sm min-w-[24px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
          style={{ lineHeight: "14px" }}
        >
          <ItemsCountDisplay
            numItems={numItemsInInventory}
            opacityClass={isHovered ? "opacity-100" : "opacity-0"}
          />
        </div>
      </button>
    );
  }
);

function ItemsCountDisplay({ numItems, opacityClass }: { numItems: number; opacityClass: string }) {
  const fullInventoryClass =
    numItems > INVENTORY_DEFAULT_CAPACITY
      ? UNMET_REQUIREMENT_TEXT_COLOR
      : numItems === INVENTORY_DEFAULT_CAPACITY
        ? "text-yellow-400"
        : "";
  return (
    <div
      key={numItems}
      className={`
        border p-1 rounded-full bg-slate-800 ${fullInventoryClass}
        animate-slide-appear-from-top-then-disappear ${opacityClass} pointer-events-none`}
    >
      {numItems}
    </div>
  );
}
