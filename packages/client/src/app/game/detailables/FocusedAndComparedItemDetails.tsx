import { useGameStore } from "@/stores/game-store";
import { useUIStore } from "@/stores/ui-store";
import setComparedItem from "@/utils/set-compared-item";
import { Item } from "@speed-dungeon/common";
import React, { useEffect } from "react";
import ItemDetails from "./ItemDetails";
import shouldDisplayModTooltip from "./should-display-mod-tooltip";

interface Props {
  focusedItem: Item;
}

export default function FocusedAndComparedItemDetails({ focusedItem }: Props) {
  const mutateGameState = useGameStore().mutateState;
  const comparedItemOption = useGameStore().comparedItem;
  const comparedSlotOption = useGameStore().comparedSlot;
  const modKeyHeld = useUIStore().modKeyHeld;
  const focusedItemId = focusedItem.entityProperties.id;

  useEffect(() => {
    setComparedItem(focusedItemId, modKeyHeld);

    return () =>
      mutateGameState((gameState) => {
        gameState.comparedSlot = null;
      });
  }, [modKeyHeld, focusedItemId]);

  const focusedItemDisplay = (
    <ItemDetails
      key="considered"
      shouldShowModKeyTooltip={false}
      itemOption={focusedItem}
      extraStyles={""}
      marginSide={"Right"}
      isComparedItem={false}
    />
  );

  const comparedItemDisplay = (
    <ItemDetails
      key="compared"
      shouldShowModKeyTooltip={shouldDisplayModTooltip(comparedSlotOption, focusedItem)}
      itemOption={comparedItemOption}
      extraStyles={""}
      marginSide={"Left"}
      isComparedItem={true}
    />
  );

  const displays = [focusedItemDisplay, comparedItemDisplay];

  return (
    <div className="flex-grow flex">
      {displays[0]}
      {displays[1]}
    </div>
  );
}
