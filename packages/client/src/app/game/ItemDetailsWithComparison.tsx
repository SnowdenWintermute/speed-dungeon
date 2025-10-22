import React from "react";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import { FocusedAndComparedItemDetails } from "./detailables/FocusedAndComparedItemDetails";

export const ItemDetailsWithComparison = observer(() => {
  const { focusStore } = AppStore.get();
  const { hoveredItem, detailedItem } = focusStore.getFocusedItems();

  const focusedItemOption = hoveredItem || detailedItem;

  if (!focusedItemOption) return <></>;
  else return <FocusedAndComparedItemDetails focusedItem={focusedItemOption} />;
});
