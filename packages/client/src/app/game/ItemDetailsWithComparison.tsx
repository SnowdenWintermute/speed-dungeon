import { useGameStore } from "@/stores/game-store";
import { DetailableEntityType } from "@/stores/game-store/detailable-entities";
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
  if (detailedEntity !== null && detailedEntity.type === DetailableEntityType.Item)
    detailedItemOption = detailedEntity.item;

  let hoveredItemOption: null | Item = null;
  if (hoveredEntity !== null && hoveredEntity.type === DetailableEntityType.Item)
    hoveredItemOption = hoveredEntity.item;

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
