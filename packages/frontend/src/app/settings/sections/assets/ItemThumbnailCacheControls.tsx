"use client";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import { BYTES_PER_KB } from "@speed-dungeon/common";
import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import { AlertsService } from "@/client-application/alerts";
import { ItemThumbnailService } from "@/client-application/item-thumbnails";

interface Props {
  itemThumbnails: ItemThumbnailService;
  alertsService: AlertsService;
}

export const ItemThumbnailCacheControls = observer(({ itemThumbnails, alertsService }: Props) => {
  // reading the total costs a pass over every stored image, so it happens when this panel appears
  // rather than on every page load
  useEffect(() => {
    itemThumbnails.loadCacheContents();
  }, [itemThumbnails]);

  const { cacheContentsOption } = itemThumbnails;

  return (
    <div className="flex flex-col gap-2">
      <ButtonBasic
        onClick={() => {
          itemThumbnails
            .clear()
            .then(() => alertsService.setAlert("Item thumbnails cleared", true))
            .catch((error) => alertsService.setAlert(error));
        }}
      >
        Clear item thumbnails
      </ButtonBasic>
      <span className="text-sm text-slate-400">
        {cacheContentsOption === null
          ? "reading thumbnail cache..."
          : `${cacheContentsOption.thumbnailCount} cached (${(
              cacheContentsOption.sizeBytes / BYTES_PER_KB
            ).toFixed(2)} kb)`}
      </span>
    </div>
  );
});
