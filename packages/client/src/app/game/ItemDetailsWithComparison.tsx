import { useGameStore } from "@/stores/game-store";
import { Item } from "@speed-dungeon/common";
import React from "react";
import { FocusedAndComparedItemDetails } from "./detailables/FocusedAndComparedItemDetails";

export default function ItemDetailsWithComparison() {
  const hoveredEntity = useGameStore((state) => state.hoveredEntity);
  const detailedEntity = useGameStore((state) => state.detailedEntity);

  const hoveredItemOption = hoveredEntity instanceof Item ? hoveredEntity : null;
  const detailedItemOption = detailedEntity instanceof Item ? detailedEntity : null;
  const focusedItemOption = hoveredItemOption || detailedItemOption;

  if (!focusedItemOption) return <></>;
  else return <FocusedAndComparedItemDetails focusedItem={focusedItemOption} />;
}
