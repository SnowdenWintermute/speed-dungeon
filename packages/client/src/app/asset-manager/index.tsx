"use client";
import { getClientAppAssetService } from "@/singletons";
import React, { useEffect } from "react";

export default function AssetManager() {
  useEffect(() => {
    const initAssetService = async () => {
      try {
        await getClientAppAssetService().initialize({ clearCache: true });
        await getClientAppAssetService().scheduleAssetUpdates();
        await getClientAppAssetService().startAssetUpdatesPrefetch();
      } catch (err) {
        console.error(err);
      }
    };
    initAssetService();
  }, []);

  // const assetService = getClientAppAssetService();

  return (
    <div id="asset-manager">
      <div>fetches</div>
      {
        // Array.from(assetService.activeFetchList.entries()).map(([assetId, managedFetch]) => (
        // <div key={assetId}>{assetId}</div>
        // ))
      }
    </div>
  );
}
