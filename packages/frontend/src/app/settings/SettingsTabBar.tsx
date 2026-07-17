"use client";
import React from "react";
import { SETTINGS_TAB_STRINGS, SettingsTab } from "./tabs";

interface Props {
  tabs: SettingsTab[];
  selectedTab: SettingsTab;
  onSelectTab: (tab: SettingsTab) => void;
}

export function SettingsTabBar({ tabs, selectedTab, onSelectTab }: Props) {
  return (
    <ul className="flex border-b border-slate-400">
      {tabs.map((tab) => (
        <li key={tab}>
          <button
            className={`h-10 px-4 border-r border-slate-400 hover:bg-slate-950 ${
              tab === selectedTab ? "bg-slate-950" : ""
            }`}
            onClick={() => {
              onSelectTab(tab);
            }}
          >
            {SETTINGS_TAB_STRINGS[tab]}
          </button>
        </li>
      ))}
    </ul>
  );
}
