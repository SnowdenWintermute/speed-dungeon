import { useUIStore } from "@/stores/ui-store";
import { Item } from "@speed-dungeon/common";
import React, { useEffect } from "react";

interface Props {
  item: Item;
  flipDisplayOrder: boolean;
}

export default function FocusedAndComparedItemDetails({ item, flipDisplayOrder }: Props) {
  const modKeyHeld = useUIStore().modKeyHeld;
  const itemId = item.entityProperties.id;

  useEffect(() => {
    //
  }, [modKeyHeld, itemId]);

  // const focusedItemDisplay =

  return (
    <div className="flex-grow flex">
      {
        //
      }
    </div>
  );
}
