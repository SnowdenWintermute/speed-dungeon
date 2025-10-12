import React from "react";
import { FocusedAndComparedItemDetails } from "./detailables/FocusedAndComparedItemDetails";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";

export const ItemDetailsWithComparison = observer(() => {
  const { focusStore } = AppStore.get();
  const { hoveredItem, detailedItem } = focusStore.getFocusedItems();

  const focusedItemOption = hoveredItem || detailedItem;

  if (!focusedItemOption) return <></>;
  else return <FocusedAndComparedItemDetails focusedItem={focusedItemOption} />;
});
