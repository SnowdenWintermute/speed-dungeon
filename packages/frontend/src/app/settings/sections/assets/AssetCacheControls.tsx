"use client";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { ClientAppAssetService } from "@speed-dungeon/common";
import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import { ConfirmationModal } from "@/app/components/molocules/ConfirmationModal";
import { ItemThumbnailService } from "@/client-application/item-thumbnails";

interface Props {
  assetService: ClientAppAssetService;
  itemThumbnails: ItemThumbnailService;
}

export const AssetCacheControls = observer(({ assetService, itemThumbnails }: Props) => {
  const [confirmingClear, setConfirmingClear] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <ButtonBasic onClick={() => assetService.refetch()}>Refetch</ButtonBasic>
      <ButtonBasic onClick={() => setConfirmingClear(true)}>Clear cache</ButtonBasic>
      <ButtonBasic onClick={() => itemThumbnails.clear()}>Clear item thumbnails</ButtonBasic>
      {confirmingClear && (
        <ConfirmationModal
          title="Clear cached assets?"
          onCancel={() => setConfirmingClear(false)}
          onConfirm={() => {
            setConfirmingClear(false);
            assetService.clearCache();
          }}
        >
          <p className="text-red-400 mb-1">
            This deletes every cached asset and stops asset loading until you press Refetch.
          </p>
          <p className="mb-2">Really clear the cache?</p>
        </ConfirmationModal>
      )}
    </div>
  );
});
