import React from "react";
import { ActionMenuButtonProperties } from "./menu-state";
import ActionMenuDedicatedButton from "./action-menu-buttons/ActionMenuDedicatedButton";

export function BottomButtons({
  numPages,
  currentPageNumber,
  left,
  right,
}: {
  numPages: number;
  currentPageNumber: number;
  left?: ActionMenuButtonProperties;
  right?: ActionMenuButtonProperties;
}) {
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
        style={numPages <= 1 ? { display: "none" } : {}}
      >
        <span>
          Page {currentPageNumber}/{numPages}
        </span>
      </div>
      <div key={right?.key} className="flex-1 flex border-l border-slate-400 h-full">
        {right && <ActionMenuDedicatedButton extraStyles="w-full justify-end" properties={right} />}
      </div>
    </div>
  );
}
