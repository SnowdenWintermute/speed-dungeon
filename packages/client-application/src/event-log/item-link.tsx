import React from "react";
import {
  CONSUMABLE_TEXT_COLOR,
  Consumable,
  Equipment,
  Item,
  MAGICAL_PROPERTY_BLUE_TEXT,
} from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import { DetailableEntityFocus } from "../detailables/detailable-entity-focus";

export const ItemLink = observer(
  ({ item, detailablesFocus }: { item: Item; detailablesFocus: DetailableEntityFocus }) => {
    let textColor = "text-zinc-300";
    if (item instanceof Consumable) {
      textColor = CONSUMABLE_TEXT_COLOR;
    } else if (item instanceof Equipment && item.isMagical()) {
      textColor = MAGICAL_PROPERTY_BLUE_TEXT;
    }

    function handleFocus() {
      detailablesFocus.detailables.setHovered(item);
    }

    function handleBlur() {
      detailablesFocus.detailables.clearHovered();
    }

    const { detailedItem } = detailablesFocus.getFocusedItems();

    const isDetailedEntity =
      detailedItem?.entityProperties.id === item.entityProperties.id &&
      detailedItem.craftingIteration === item.craftingIteration;

    return (
      <button
        className={`underline cursor-pointer ${isDetailedEntity ? "outline outline-1 outline-yellow-500" : ""} ${textColor}`}
        aria-label={`Crafting result for item: ${item.entityProperties.name}`}
        onClick={() => {
          if (isDetailedEntity) {
            detailablesFocus.detailables.clearDetailed();
          } else {
            detailablesFocus.detailables.setDetailed(item);
          }
        }}
        onMouseEnter={handleFocus}
        onMouseLeave={handleBlur}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {item.entityProperties.name}
      </button>
    );
  }
);
