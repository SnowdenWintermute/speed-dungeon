"use client";
import { HTTP_REQUEST_NAMES, SPACING_REM_SMALL } from "@/client-consts";
import React, { useState } from "react";
import { HotkeyButton } from "../components/atoms/HotkeyButton";
import XShape from "../../../public/img/basic-shapes/x-shape.svg";
import { ZIndexLayers } from "../z-index-layers";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { DialogElementName } from "@/client-application/ui/dialogs";
import { SETTINGS_TAB_REQUIRES_AUTH, SettingsTab } from "./tabs";
import { SettingsTabBar } from "./SettingsTabBar";
import { AccountSection } from "./sections/account";
import { KeybindsSection } from "./sections/keybinds";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";

export const Settings = observer(() => {
  const clientApplication = useClientApplication();
  const { session } = clientApplication;
  const { dialogs, httpRequests } = clientApplication.uiStore;
  const settingsIsOpen = dialogs.isOpen(DialogElementName.AppSettings);
  const { usernameOption } = session;
  const isLoggedIn = usernameOption !== null;

  const [selectedTabState, setSelectedTab] = useState<SettingsTab | null>(null);

  if (!settingsIsOpen) return <></>;

  const visibleTabs = iterateNumericEnumKeyedRecord(SETTINGS_TAB_REQUIRES_AUTH)
    .filter(([, requiresAuth]) => isLoggedIn || !requiresAuth)
    .map(([tab]) => tab);

  const defaultTab = isLoggedIn ? SettingsTab.Account : SettingsTab.Keybinds;
  const selectedTab =
    selectedTabState !== null && visibleTabs.includes(selectedTabState)
      ? selectedTabState
      : defaultTab;

  return (
    <section
      aria-label="settings menu"
      className={`fixed inset-0 bg-slate-700 pointer-events-auto`}
      style={{ zIndex: ZIndexLayers.SettingsMenu }}
    >
      <div
        className="h-10 w-full border-b border-slate-400 flex items-center justify-between"
        style={{ paddingLeft: `${SPACING_REM_SMALL}rem` }}
      >
        <h2 className="text-lg">Settings</h2>
        <HotkeyButton
          className="p-2 h-full w-fit border cursor-pointer"
          hotkeys={["Escape"]}
          ariaLabel="close settings window"
          onClick={() => {
            dialogs.setIsOpen(DialogElementName.AppSettings, false);
            delete httpRequests.requests[HTTP_REQUEST_NAMES.PASSWORD_RESET_EMAIL];
          }}
        >
          <XShape className="h-full w-full fill-slate-400" />
        </HotkeyButton>
      </div>
      <SettingsTabBar tabs={visibleTabs} selectedTab={selectedTab} onSelectTab={setSelectedTab} />
      <div className="flex flex-col" style={{ padding: `${SPACING_REM_SMALL}rem` }}>
        {selectedTab === SettingsTab.Account && <AccountSection />}
        {selectedTab === SettingsTab.Keybinds && <KeybindsSection />}
      </div>
    </section>
  );
});
