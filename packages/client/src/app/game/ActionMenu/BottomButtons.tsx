import React from "react";
import ActionMenuDedicatedButton from "./action-menu-buttons/ActionMenuDedicatedButton";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuButtonProperties } from "./menu-state/action-menu-button-properties";

export const BottomButtons = observer(
  ({ left, right }: { left?: ActionMenuButtonProperties; right?: ActionMenuButtonProperties }) => {
    const { actionMenuStore } = AppStore.get();
    const currentMenu = actionMenuStore.getCurrentMenu();
    const pageCount = currentMenu.getPageCount();
    const currentPageIndex = currentMenu.getPageIndex();

    return (
      <div
        className="flex justify-between bg-slate-700 relative border border-slate-400 h-8"
        style={!left && !right ? { opacity: 0 } : {}}
      >
        <div key={left?.key} className="flex-1 border-r border-slate-400 h-full">
          {left && <ActionMenuDedicatedButton extraStyles="w-full h-full" properties={left} />}
        </div>
        <div
          className="h-full flex items-center justify-center pr-2 pl-2"
          style={pageCount <= 1 ? { display: "none" } : {}}
        >
          <span>
            Page {currentPageIndex}/{pageCount}
          </span>
        </div>
        <div key={right?.key} className="flex-1 flex border-l border-slate-400 h-full">
          {right && (
            <ActionMenuDedicatedButton extraStyles="w-full justify-end" properties={right} />
          )}
        </div>
      </div>
    );
  }
);
