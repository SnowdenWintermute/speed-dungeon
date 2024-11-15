import { useGameStore } from "@/stores/game-store";
import { Item } from "@speed-dungeon/common";
import React from "react";
import FocusedAndComparedItemDetails from "./detailables/FocusedAndComparedItemDetails";

interface Props {
  flipDisplayOrder: boolean;
}

export default function ItemDetailsWithComparison({ flipDisplayOrder }: Props) {
  const detailedEntity = useGameStore().detailedEntity;
  const hoveredEntity = useGameStore().hoveredEntity;

  let detailedItemOption: null | Item = null;
  if (detailedEntity instanceof Item) detailedItemOption = detailedEntity;

  let hoveredItemOption: null | Item = null;
  if (hoveredEntity instanceof Item) hoveredItemOption = hoveredEntity;

  const focusedItemOption =
    hoveredItemOption !== null
      ? hoveredItemOption
      : detailedItemOption !== null
        ? detailedItemOption
        : null;

  if (!focusedItemOption) return <></>;
  else
    return (
      <FocusedAndComparedItemDetails
        focusedItem={focusedItemOption}
        flipDisplayOrder={flipDisplayOrder}
      />
    );
}
