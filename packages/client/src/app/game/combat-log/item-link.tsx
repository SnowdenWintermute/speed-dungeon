import React from "react";
import {
  CONSUMABLE_TEXT_COLOR,
  Consumable,
  Equipment,
  Item,
  MAGICAL_PROPERTY_BLUE_TEXT,
} from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";
import { observer } from "mobx-react-lite";

export const ItemLink = observer(({ item }: { item: Item }) => {
  const { focusStore } = AppStore.get();
  let textColor = "text-zinc-300";
  if (item instanceof Consumable) textColor = CONSUMABLE_TEXT_COLOR;
  else if (item instanceof Equipment && Equipment.isMagical(item))
    textColor = MAGICAL_PROPERTY_BLUE_TEXT;

  function handleFocus() {
    focusStore.setHovered(item);
  }

  function handleBlur() {
    focusStore.clearHovered();
  }

  const { detailedItem } = focusStore.getFocusedItems();

  const isDetailedEntity =
    detailedItem?.entityProperties.id === item.entityProperties.id &&
    detailedItem.craftingIteration === item.craftingIteration;

  return (
    <button
      className={`underline cursor-pointer ${isDetailedEntity ? "outline outline-1 outline-yellow-500" : ""} ${textColor}`}
      aria-label={`Crafting result for item: ${item.entityProperties.name}`}
      onClick={() => {
        if (isDetailedEntity) focusStore.clearDetailed();
        else focusStore.setDetailed(item);
      }}
      onMouseEnter={handleFocus}
      onMouseLeave={handleBlur}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {item.entityProperties.name}
    </button>
  );
});
