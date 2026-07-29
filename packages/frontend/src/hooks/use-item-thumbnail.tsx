"use client";
import { Item } from "@speed-dungeon/common";
import { useEffect } from "react";
import { useClientApplication } from "./create-client-application-context";

/** Reads an item's thumbnail, asking for it to be created if nobody has yet. Requesting is
 * idempotent, so any number of components may display the same item. */
export function useItemThumbnail(itemOption: null | undefined | Item) {
  const { itemThumbnails } = useClientApplication();

  useEffect(() => {
    if (itemOption) {
      itemThumbnails.request(itemOption);
    }
  });

  if (!itemOption) {
    return undefined;
  }
  return itemThumbnails.getOption(itemOption);
}
