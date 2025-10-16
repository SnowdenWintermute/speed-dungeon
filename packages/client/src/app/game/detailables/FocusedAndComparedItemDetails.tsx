import { Equipment, Item } from "@speed-dungeon/common";
import React, { useEffect } from "react";
import { ItemDetails } from "./ItemDetails";
import shouldDisplayModTooltip from "./should-display-mod-tooltip";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import { ModifierKey } from "@/mobx-stores/input";

interface Props {
  focusedItem: Item;
}

export const FocusedAndComparedItemDetails = observer(({ focusedItem }: Props) => {
  const { focusStore, inputStore } = AppStore.get();
  const modKeyHeld = inputStore.getKeyIsHeld(ModifierKey.Mod);
  const { comparedItem, comparedSlot } = focusStore.getItemComparison();
  const focusedItemId = focusedItem.entityProperties.id;

  useEffect(() => {
    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
    focusStore.updateItemComparison(focusedItem, modKeyHeld, focusedCharacter.getEquipmentOption());

    return () => {
      focusStore.clearItemComparison();
    };
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
        shouldShowModKeyTooltip={shouldDisplayModTooltip(comparedSlot, focusedItem)}
        itemOption={comparedItem}
        extraStyles={""}
        marginSide={"Left"}
        isComparedItem={true}
      />
    ) : (
      <ItemDetails
        key="compared"
        shouldShowModKeyTooltip={false}
        itemOption={comparedItem}
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
