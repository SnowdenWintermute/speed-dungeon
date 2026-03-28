"use client";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client-consts";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import Divider from "../components/atoms/Divider";
import { ClickOutsideHandlerWrapper } from "../components/atoms/ClickOutsideHandlerWrapper";

export const AssetManager = observer(() => {
  const clientApplication = useClientApplication();
  const { assetFetchProgress } = clientApplication.uiStore;

  useEffect(() => {
    const initAssetService = async () => {
      try {
        const { assetService } = clientApplication;

        const manifest = await assetService.initialize({
          // clearCache: true,
          onFetchStartedCallback: (assetId) => {
            assetFetchProgress.onFetchStart(assetId);
          },
          onFetchCompleteCallback: (assetId) => {
            assetFetchProgress.onFetchComplete(assetId);
          },
          onFetchAbortCallback: (assetId) => {
            assetFetchProgress.onFetchAbort(assetId);
          },
        });

        if (manifest === undefined) {
          console.error("unable to obtain manifest");
          return;
        }

        const prefetchQueue = await assetService.scheduleAssetUpdates();
        assetFetchProgress.initialize(manifest, prefetchQueue);
        await assetService.startAssetUpdatesPrefetch();
      } catch (err) {
        console.error(err);
        clientApplication.alertsService.setAlert("couldn't fetch asset manifest");
      }
    };

    initAssetService();
  }, []);

  const { initialized, displayPercent, isComplete } = assetFetchProgress;

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
                {Array.from(assetFetchProgress.fetchCompletions).map(([assetId, data]) => {
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
