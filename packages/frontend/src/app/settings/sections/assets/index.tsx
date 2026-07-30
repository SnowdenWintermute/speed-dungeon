"use client";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import React from "react";
import Divider from "@/app/components/atoms/Divider";
import { AssetFetchStatus } from "./AssetFetchStatus";
import { AssetFetchList } from "./AssetFetchList";
import { AssetCacheControls } from "./AssetCacheControls";
import { ItemThumbnailCacheControls } from "./ItemThumbnailCacheControls";

export const AssetsSection = observer(() => {
  const clientApplication = useClientApplication();
  const { assetService, itemThumbnails, alertsService } = clientApplication;
  const { progressTracker } = assetService;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <AssetFetchStatus progressTracker={progressTracker} />
      <Divider />
      <div className="flex flex-1 min-h-0 gap-2">
        <AssetFetchList progressTracker={progressTracker} />
        <div>
          <div className="mb-2">
            <AssetCacheControls assetService={assetService} />
          </div>
          <ItemThumbnailCacheControls
            itemThumbnails={itemThumbnails}
            alertsService={alertsService}
          />
        </div>
      </div>
    </div>
  );
});
