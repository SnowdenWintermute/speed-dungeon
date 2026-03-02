"use client";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import { AppStore } from "@/mobx-stores/app-store";
import { getClientAppAssetService } from "@/singletons";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import LoadingSpinner from "../components/atoms/LoadingSpinner";
import Divider from "../components/atoms/Divider";
import ClickOutsideHandlerWrapper from "../components/atoms/ClickOutsideHandlerWrapper";

export const AssetManager = observer(() => {
  useEffect(() => {
    const initAssetService = async () => {
      try {
        const { assetFetchProgressStore } = AppStore.get();

        const manifest = await getClientAppAssetService().initialize({
          clearCache: true,
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
  const { initialized } = assetFetchProgressStore;

  const [hovered, setHovered] = useState(false);
  function handleFocus() {
    setHovered(true);
  }
  function handleBlur() {
    setHovered(false);
  }
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
          // onMouseEnter={handleFocus}
          // onMouseLeave={handleBlur}
          // onFocus={handleFocus}
          // onBlur={handleBlur}
          onClick={handleClick}
        >
          {initialized ? (
            <div className="w-fit">
              prefetching assets {Math.round(assetFetchProgressStore.percentComplete)}%
            </div>
          ) : (
            <div>loading application code</div>
          )}
          {hovered && initialized && (
            <div className="overflow-auto">
              <Divider />
              <ul className="flex flex-wrap justify-between">
                {Array.from(assetFetchProgressStore.fetchCompletions).map(([assetId, data]) => {
                  const { isComplete, started, aborted } = data;
                  const textColor = (() => {
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
