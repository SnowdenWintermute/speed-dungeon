"use client";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client-consts";
import { AppStore } from "@/mobx-stores/app-store";
import { getClientAppAssetService } from "@/singletons";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import Divider from "../components/atoms/Divider";
import ClickOutsideHandlerWrapper from "../components/atoms/ClickOutsideHandlerWrapper";

export const AssetManager = observer(() => {
  useEffect(() => {
    const initAssetService = async () => {
      try {
        const { assetFetchProgressStore } = AppStore.get();

        const manifest = await getClientAppAssetService().initialize({
          // clearCache: true,
          onFetchStartedCallback: (assetId) => {
            assetFetchProgressStore.onFetchStart(assetId);
          },
          onFetchCompleteCallback: (assetId) => {
            assetFetchProgressStore.onFetchComplete(assetId);
          },
          onFetchAbortCallback: (assetId) => {
            assetFetchProgressStore.onFetchAbort(assetId);
          },
        });

        if (manifest === undefined) {
          console.error("unable to obtain manifest");
          return;
        }

        const prefetchQueue = await getClientAppAssetService().scheduleAssetUpdates();
        assetFetchProgressStore.initialize(manifest, prefetchQueue);
        await getClientAppAssetService().startAssetUpdatesPrefetch();
      } catch (err) {
        console.error(err);
      }
    };

    initAssetService();
  }, []);

  const { assetFetchProgressStore } = AppStore.get();
  const { initialized, displayPercent, isComplete } = assetFetchProgressStore;

  const [hovered, setHovered] = useState(false);
  function handleClick() {
    setHovered(!hovered);
  }

  return (
    <div
      id="asset-manager"
      className="absolute bottom-0 left-0 max-h-screen max-w-screen overflow-hidden pointer-events-auto"
      style={{ zIndex: 30 }}
    >
      <ClickOutsideHandlerWrapper onClickOutside={() => setHovered(false)} isActive={hovered}>
        <button
          className="bg-slate-700 border-slate-400 border m-6 p-2 max-h-full max-w-full overflow-hidden"
          onClick={handleClick}
        >
          {initialized && isComplete ? (
            <div className="flex align-middle">
              <span>up to date</span>{" "}
            </div>
          ) : initialized ? (
            <div className="w-fit">prefetching assets {displayPercent}%</div>
          ) : (
            <div>loading application code...</div>
          )}
          {hovered && initialized && (
            <div className="overflow-auto">
              <Divider />
              <ul className="flex flex-wrap justify-between">
                {Array.from(assetFetchProgressStore.fetchCompletions).map(([assetId, data]) => {
                  const { wasCached, isComplete, started, aborted } = data;
                  const textColor = (() => {
                    if (wasCached) {
                      return "text-blue-400";
                    }
                    if (isComplete) {
                      return "text-green-600";
                    }
                    if (aborted) {
                      return "text-yellow-400";
                    }
                    if (started) {
                      return "text-zinc-300";
                    }
                    return UNMET_REQUIREMENT_TEXT_COLOR;
                  })();

                  const statusIndicator = (() => {
                    if (isComplete) {
                      return <span>✓</span>;
                    }
                    if (started || aborted) {
                      return <div>...</div>;
                    }
                    return <span>✗</span>;
                  })();

                  return (
                    <li key={assetId} className={`flex justify-between ${textColor} w-72 `}>
                      <div
                        className="whitespace-nowrap text-ellipsis overflow-hidden text-left"
                        style={{ direction: "rtl" }}
                      >
                        {assetId}
                      </div>
                      <div>{statusIndicator}</div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </button>
      </ClickOutsideHandlerWrapper>
    </div>
  );
});
