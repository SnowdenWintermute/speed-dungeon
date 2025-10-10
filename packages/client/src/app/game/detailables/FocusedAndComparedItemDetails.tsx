import { useGameStore } from "@/stores/game-store";
import setComparedItem from "@/utils/set-compared-item";
import { Equipment, Item } from "@speed-dungeon/common";
import React, { useEffect } from "react";
import ItemDetails from "./ItemDetails";
import shouldDisplayModTooltip from "./should-display-mod-tooltip";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import { ModifierKey } from "@/mobx-stores/input";

interface Props {
  focusedItem: Item;
}

export const FocusedAndComparedItemDetails = observer(({ focusedItem }: Props) => {
  const mutateGameState = useGameStore().mutateState;
  const comparedItemOption = useGameStore().comparedItem;
  const comparedSlotOption = useGameStore().comparedSlot;
  const modKeyHeld = AppStore.get().inputStore.getKeyIsHeld(ModifierKey.Mod);
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

  const comparedItemDisplay =
    focusedItem instanceof Equipment ? (
      <ItemDetails
        key="compared"
        shouldShowModKeyTooltip={shouldDisplayModTooltip(comparedSlotOption, focusedItem)}
        itemOption={comparedItemOption}
        extraStyles={""}
        marginSide={"Left"}
        isComparedItem={true}
      />
    ) : (
      <ItemDetails
        key="compared"
        shouldShowModKeyTooltip={false}
        itemOption={comparedItemOption}
        extraStyles={""}
        marginSide={"Left"}
        isComparedItem={true}
      />
    );
  const displays = [focusedItemDisplay, comparedItemDisplay];

  return (
    <div className="flex-grow flex max-w-[818px]">
      {displays[0]}
      {displays[1]}
    </div>
  );
});
