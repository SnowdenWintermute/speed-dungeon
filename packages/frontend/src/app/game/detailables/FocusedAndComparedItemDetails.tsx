import { Equipment, Item } from "@speed-dungeon/common";
import React, { useEffect } from "react";
import { ItemDetails } from "./ItemDetails";
import shouldDisplayModTooltip from "./should-display-mod-tooltip";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { useCharacterSheetSubject } from "@/app/components/character-sheet/character-sheet-subject-context";
import { ModifierKey } from "@/client-application/ui/inputs";

interface Props {
  focusedItem: Item;
}

export const FocusedAndComparedItemDetails = observer(({ focusedItem }: Props) => {
  const clientApplication = useClientApplication();
  const { detailableEntityFocus } = clientApplication;
  const subject = useCharacterSheetSubject();
  const { inputs } = clientApplication.uiStore;
  const modKeyHeld = inputs.getKeyIsHeld(ModifierKey.Mod);
  const { comparedItem, comparedSlotId } = detailableEntityFocus.getItemComparison();
  const focusedItemId = focusedItem.entityProperties.id;

  useEffect(() => {
    detailableEntityFocus.updateItemComparison(
      focusedItem,
      modKeyHeld,
      subject.combatant.getEquipmentOption()
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
        shouldShowModKeyTooltip={shouldDisplayModTooltip(comparedSlotId, focusedItem)}
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
