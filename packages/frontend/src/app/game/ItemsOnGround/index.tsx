import Divider from "@/app/components/atoms/Divider";
import { AdventuringParty } from "@speed-dungeon/common";
import React from "react";
import { ItemOnGround } from "./ItemOnGround";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { DropTargetType } from "@/client-application/item-drag/types";
import { DropResolutionType } from "@/client-application/item-drag/resolve-drop";
import { useDropTarget } from "@/app/game/item-drag/use-drop-target";
import { dropTargetBgClass, dropTargetBorderClass } from "@/app/game/item-drag/highlight-styles";

interface Props {
  party: AdventuringParty;
  maxHeightRem: number;
}

export const ItemsOnGround = observer(({ party, maxHeightRem }: Props) => {
  const itemsToDisplay = party.currentRoom.inventory.getItems();
  const clientApplication = useClientApplication();
  const { actionMenu, combatantFocus } = clientApplication;
  const showItemsOnGround = actionMenu.getShowGroundItems();

  const playerOwnsCharacter = combatantFocus.clientUserControlsFocusedCombatant({
    includePets: true,
  });

  const groundDrop = useDropTarget({ type: DropTargetType.Ground });
  const isDroppable = groundDrop.resolution.type === DropResolutionType.Valid;
  const droppableBorder = dropTargetBorderClass(groundDrop.resolution, groundDrop.isHovered) ?? "";
  const droppableBg = dropTargetBgClass(groundDrop.resolution, groundDrop.isHovered);

  // when there's nothing on the ground yet, still show a full-list-sized drop zone while a
  // droppable item is dragged
  if (itemsToDisplay.length < 1) {
    if (!isDroppable) {
      return <></>;
    }
    return (
      <div
        className={`w-full border pointer-events-auto flex items-center justify-center text-center text-slate-300 ${droppableBorder} ${droppableBg}`}
        style={{ height: `${maxHeightRem}rem` }}
        onPointerEnter={groundDrop.onPointerEnter}
        onPointerLeave={groundDrop.onPointerLeave}
      >
        Drop here to leave on the ground
      </div>
    );
  }

  return (
    <div
      className={`w-full border bg-slate-700 p-2 pointer-events-auto flex flex-col h-fit ${droppableBorder} ${droppableBg}`}
      style={{
        maxHeight: `${maxHeightRem}rem`,
        minHeight: isDroppable ? `${maxHeightRem}rem` : undefined,
      }}
      onPointerEnter={groundDrop.onPointerEnter}
      onPointerLeave={groundDrop.onPointerLeave}
    >
      <div className="flex justify-between">
        <span>{"Items on the ground"}</span>
        <HotkeyButton
          onClick={() => {
            actionMenu.setShowGroundItems(!showItemsOnGround);
          }}
        >
          {showItemsOnGround ? "Hide" : "Show"}
        </HotkeyButton>
      </div>
      <Divider />
      {showItemsOnGround && (
        <ul className="list-none flex-grow overflow-y-auto">
          {itemsToDisplay.map((item) => (
            <ItemOnGround
              key={item.entityProperties.id}
              item={item}
              disabled={!playerOwnsCharacter}
            />
          ))}
        </ul>
      )}
    </div>
  );
});
