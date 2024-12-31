import React, { useEffect, useState } from "react";
import BackpackIcon from "../../../../public/img/game-ui-icons/backpack.svg";
import shouldShowCharacterSheet from "@/utils/should-show-character-sheet";
import { getCurrentMenu, inventoryItemsMenuState, useGameStore } from "@/stores/game-store";
import { INVENTORY_DEFAULT_CAPACITY } from "@speed-dungeon/common";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";

export default function InventoryIconButton({
  entityId,
  numItemsInInventory,
}: {
  entityId: string;
  numItemsInInventory: number;
}) {
  const mutateGameState = useGameStore().mutateState;
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
        mutateGameState((state) => {
          let switchedFocusedCharacter = false;
          if (state.focusedCharacterId !== entityId) {
            state.focusedCharacterId = entityId;
            switchedFocusedCharacter = true;
          }
          if (shouldShowCharacterSheet(getCurrentMenu(state).type) && !switchedFocusedCharacter)
            state.stackedMenuStates = [];
          else if (!shouldShowCharacterSheet(getCurrentMenu(state).type))
            state.stackedMenuStates.push(inventoryItemsMenuState);
        });
      }}
    >
      <BackpackIcon className="fill-slate-400 h-full w-full pointer-events-none" />
      <div
        className={`text-sm min-w-[24px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
        style={{ lineHeight: "14px" }}
      >
        <NumItemsDisplay
          numItems={numItemsInInventory}
          opacityClass={isHovered ? "opacity-100" : "opacity-0"}
        />
      </div>
    </button>
  );
}

function NumItemsDisplay({ numItems, opacityClass }: { numItems: number; opacityClass: string }) {
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
