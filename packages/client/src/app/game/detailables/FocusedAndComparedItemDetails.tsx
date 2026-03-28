import { Equipment, Item } from "@speed-dungeon/common";
import React, { useEffect } from "react";
import { ItemDetails } from "./ItemDetails";
import shouldDisplayModTooltip from "./should-display-mod-tooltip";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ModifierKey } from "@/client-application/ui/inputs";

interface Props {
  focusedItem: Item;
}

export const FocusedAndComparedItemDetails = observer(({ focusedItem }: Props) => {
  const clientApplication = useClientApplication();
  const { detailableEntityFocus } = clientApplication;
  const { inputs } = clientApplication.uiStore;
  const modKeyHeld = inputs.getKeyIsHeld(ModifierKey.Mod);
  const { comparedItem, comparedSlot } = detailableEntityFocus.getItemComparison();
  const focusedItemId = focusedItem.entityProperties.id;

  useEffect(() => {
    const focusedCharacter = clientApplication.combatantFocus.requireFocusedCharacter();
    detailableEntityFocus.updateItemComparison(
      focusedItem,
      modKeyHeld,
      focusedCharacter.getEquipmentOption()
    );

    return () => {
      detailableEntityFocus.clearItemComparison();
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
