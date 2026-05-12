import LoadingSpinner from "@/app/components/atoms/LoadingSpinner";
import { IconName, SVG_ICONS } from "@/app/icons";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { Switch, SwitchThumb } from "@radix-ui/react-switch";
import { invariant } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";

export const ConnectionSelector = observer(() => {
  const clientApplication = useClientApplication();
  const { topologyManager } = clientApplication;
  const { canEnterOffline, isOnline, isOffline, isInitialized } = topologyManager;

  function handleClick() {
    if (isOnline && canEnterOffline) {
      topologyManager.enterOffline();
    } else if (isOffline) {
      const lobbyServerUrl = process.env.NEXT_PUBLIC_WS_SERVER_URL;
      invariant(lobbyServerUrl !== undefined, "no lobby server url provided");
      topologyManager.enterOnline();
    }
  }

  return (
    <div className="flex">
      <Switch
        className="h-[25px] w-[42px] border border-slate-400 data-[state=checked]:bg-slate-800 disabled:opacity-50 mr-2"
        checked={isOnline}
        disabled={!canEnterOffline || !isInitialized}
        onClick={() => handleClick()}
      >
        <SwitchThumb className="block size-[21px] translate-x-0.5 bg-slate-400 transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[19px]" />
      </Switch>

      {!isInitialized ? (
        <span className="flex items-center h-6 w-6 fill-slate-400">
          <LoadingSpinner />
        </span>
      ) : isOffline ? (
        <span className="flex items-center">
          {SVG_ICONS[IconName.WifiOffline]("h-6 fill-slate-400")}
        </span>
      ) : (
        <span className="flex items-center">
          {SVG_ICONS[IconName.WifiOnline]("h-6 fill-slate-400")}
        </span>
      )}
    </div>
  );
});
