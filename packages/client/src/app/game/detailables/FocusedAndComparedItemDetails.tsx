import { useGameStore } from "@/stores/game-store";
import { useUIStore } from "@/stores/ui-store";
import setComparedItem from "@/utils/set-compared-item";
import { Item } from "@speed-dungeon/common";
import React, { useEffect } from "react";
import ItemDetails from "./ItemDetails";
import shouldDisplayModTooltip from "./should-display-mod-tooltip";

interface Props {
  focusedItem: Item;
  flipDisplayOrder: boolean;
}

export default function FocusedAndComparedItemDetails({ focusedItem, flipDisplayOrder }: Props) {
  const mutateGameState = useGameStore().mutateState;
  const comparedItemOption = useGameStore().comparedItem;
  const comparedSlotOption = useGameStore().comparedSlot;
  const modKeyHeld = useUIStore().modKeyHeld;
  const focusedItemId = focusedItem.entityProperties.id;

  useEffect(() => {
    setComparedItem(mutateGameState, focusedItemId, modKeyHeld);

    return () =>
      mutateGameState((gameState) => {
        gameState.comparedSlot = null;
      });
  }, [modKeyHeld, focusedItemId]);

  const focusedItemDisplay = (
    <ItemDetails
      key="considered"
      title={"Item Considering"}
      shouldShowModKeyTooltip={false}
      itemOption={focusedItem}
      extraStyles={""}
      marginSide={flipDisplayOrder ? "Left" : "Right"}
      isComparedItem={false}
    />
  );

  const comparedItemDisplay = (
    <ItemDetails
      key="compared"
      title={"Compared Item"}
      shouldShowModKeyTooltip={shouldDisplayModTooltip(comparedSlotOption, focusedItem)}
      itemOption={comparedItemOption}
      extraStyles={""}
      marginSide={flipDisplayOrder ? "Right" : "Left"}
      isComparedItem={true}
    />
  );

  const displays = [focusedItemDisplay, comparedItemDisplay];
  if (flipDisplayOrder) displays.reverse();

  return (
    <div className="flex-grow flex">
      {displays[0]}
      {displays[1]}
    </div>
  );
}
