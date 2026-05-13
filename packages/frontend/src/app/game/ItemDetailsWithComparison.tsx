import React from "react";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { FocusedAndComparedItemDetails } from "./detailables/FocusedAndComparedItemDetails";

export const ItemDetailsWithComparison = observer(() => {
  const clientApplication = useClientApplication();
  const { detailableEntityFocus } = clientApplication;
  const { hoveredItem, detailedItem } = detailableEntityFocus.getFocusedItems();

  const focusedItemOption = hoveredItem || detailedItem;

  if (!focusedItemOption) return <></>;
  else return <FocusedAndComparedItemDetails focusedItem={focusedItemOption} />;
});
