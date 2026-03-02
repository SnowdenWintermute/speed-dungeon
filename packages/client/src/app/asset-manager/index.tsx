"use client";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import { AppStore } from "@/mobx-stores/app-store";
import { getClientAppAssetService } from "@/singletons";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";

export const AssetManager = observer(() => {
  useEffect(() => {
    const initAssetService = async () => {
      try {
        const { assetFetchProgressStore } = AppStore.get();

        const manifest = await getClientAppAssetService().initialize({
          clearCache: true,
          onEachFetchComplete: (assetId) => {
            assetFetchProgressStore.onFetchComplete(assetId);
          },
        });

        if (manifest === undefined) {
          console.log("unable to obtain manifest");
          return;
        }

        const prefetchQueue = await getClientAppAssetService().scheduleAssetUpdates();
        assetFetchProgressStore.initialize(prefetchQueue);
        await getClientAppAssetService().startAssetUpdatesPrefetch();
      } catch (err) {
        console.error(err);
      }
    };

    initAssetService();
  }, []);

  const { assetFetchProgressStore } = AppStore.get();

  return (
    <div id="asset-manager">
      <div>prefetching assets {Math.round(assetFetchProgressStore.percentComplete)}%</div>
      <ul>
        {Array.from(assetFetchProgressStore.fetchCompletions).map(([assetId, data]) => {
          const { isComplete } = data;
          return (
            <li
              key={assetId}
              className={`flex justify-between ${isComplete ? "text-green-600" : UNMET_REQUIREMENT_TEXT_COLOR}`}
            >
              <div>{assetId}</div>
              <div>{isComplete ? "✓" : "✗"}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
