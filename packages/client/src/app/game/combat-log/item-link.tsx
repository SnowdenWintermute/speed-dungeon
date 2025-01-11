import React from "react";
import {
  CONSUMABLE_TEXT_COLOR,
  Consumable,
  Equipment,
  Item,
  MAGICAL_PROPERTY_BLUE_TEXT,
} from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";

export function ItemLink({ item }: { item: Item }) {
  const mutateState = useGameStore().mutateState;
  let textColor = "text-zinc-300";
  if (item instanceof Consumable) textColor = CONSUMABLE_TEXT_COLOR;
  else if (item instanceof Equipment && Equipment.isMagical(item))
    textColor = MAGICAL_PROPERTY_BLUE_TEXT;

  function handleFocus() {
    mutateState((state) => {
      state.hoveredEntity = item;
    });
  }

  function handleBlur() {
    mutateState((state) => {
      state.hoveredEntity = null;
    });
  }

  const detailedEntity = useGameStore.getState().detailedEntity;
  const isDetailedEntity =
    detailedEntity?.entityProperties.id === item.entityProperties.id &&
    detailedEntity instanceof Item &&
    detailedEntity.craftingIteration === item.craftingIteration;

  return (
    <button
      className={`underline cursor-pointer ${isDetailedEntity ? "outline outline-1 outline-yellow-500" : ""} ${textColor}`}
      aria-label={`Crafting result for item: ${item.entityProperties.name}`}
      onClick={() => {
        mutateState((state) => {
          if (isDetailedEntity) state.detailedEntity = null;
          else state.detailedEntity = item;
        });
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
