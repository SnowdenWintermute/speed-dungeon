"use client";
import React from "react";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ItemDetails } from "@/app/game/detailables/ItemDetails";
import { ZIndexLayers } from "@/app/z-index-layers";

// this sheet has no inventory, so every item in it is one the combatant has equipped and there is
// nothing to compare against. covers the attributes rather than the paper doll: over the paper doll
// it would take the cursor off the slot being hovered on the way to the next one
export const ItemDetailsOverlay = observer(() => {
  const { detailableEntityFocus } = useClientApplication();
  const { hoveredItem, detailedItem } = detailableEntityFocus.getFocusedItems();
  const focusedItemOption = hoveredItem || detailedItem;

  if (!focusedItemOption) {
    return null;
  }

  return (
    <div
      className="absolute top-0 left-0 right-0"
      style={{ zIndex: ZIndexLayers.ItemDetails }}
    >
      <ItemDetails
        shouldShowModKeyTooltip={false}
        itemOption={focusedItemOption}
        extraStyles={""}
        marginSide={"Right"}
        isComparedItem={false}
      />
    </div>
  );
});
