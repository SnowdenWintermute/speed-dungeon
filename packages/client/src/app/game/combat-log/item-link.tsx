import React from "react";
import {
  BASE_TEXT,
  CONSUMABLE_TURQUOISE,
  Consumable,
  Equipment,
  Item,
  MAGICAL_PROPERTY_BLUE,
} from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";

export function ItemLink({ item }: { item: Item }) {
  const mutateState = useGameStore().mutateState;
  let textColor = BASE_TEXT;
  if (item instanceof Consumable) textColor = CONSUMABLE_TURQUOISE;
  else if (item instanceof Equipment && Equipment.isMagical(item))
    textColor = MAGICAL_PROPERTY_BLUE;

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
      className={`underline cursor-pointer ${isDetailedEntity ? "outline outline-1 outline-yellow-500" : ""}`}
      aria-label={`Crafting result for item: ${item.entityProperties.name}`}
      style={{ color: textColor }}
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
