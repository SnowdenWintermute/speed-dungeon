import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { IconName, SVG_ICONS } from "@/app/icons";
import { AppStore } from "@/mobx-stores/app-store";
import { observer } from "mobx-react-lite";
import React from "react";

export const ConnectionSelector = observer(() => {
  const { applicationRuntimeEnvironmentStore } = AppStore.get();
  const { canEnterOffline, enterOnline, enterOffline, isOnline, isOffline } =
    applicationRuntimeEnvironmentStore;

  function handleClick() {
    if (isOnline && canEnterOffline) {
      enterOffline();
    } else if (isOffline) {
      enterOnline();
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
