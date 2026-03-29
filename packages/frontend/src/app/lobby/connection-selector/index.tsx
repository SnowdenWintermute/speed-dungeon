import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { IconName, SVG_ICONS } from "@/app/icons";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { invariant } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";

export const ConnectionSelector = observer(() => {
  const clientApplication = useClientApplication();
  const { topologyManager } = clientApplication;
  const { canEnterOffline, isOnline, isOffline } = topologyManager;

  function handleClick() {
    if (isOnline && canEnterOffline) {
      topologyManager.enterOffline();
    } else if (isOffline) {
      const lobbyServerUrl = process.env.NEXT_PUBLIC_WS_SERVER_URL;
      invariant(lobbyServerUrl !== undefined, "no lobby server url provided");
      topologyManager.enterOnline(lobbyServerUrl);
    }
  }

  return (
    <HotkeyButton
      disabled={!canEnterOffline}
      className="disabled:opacity-50"
      onClick={() => handleClick()}
    >
      {isOffline ? (
        <span className="flex items-center">
          {SVG_ICONS[IconName.WifiOffline]("h-6 fill-slate-400")}
        </span>
      ) : (
        <span className="flex items-center">
          {SVG_ICONS[IconName.WifiOnline]("h-6 fill-slate-400")}
        </span>
      )}
    </HotkeyButton>
  );
});
