import React, { ReactNode } from "react";
import { BUTTON_HEIGHT } from "@/client_consts";
import { ActionMenuButtonProperties } from "../menu-state";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { useUIStore } from "@/stores/ui-store";

interface Props {
  number: number;
  properties: ActionMenuButtonProperties;
}

export default function NumberedButton({ number, properties }: Props) {
  return (
    <HotkeyButton
      className={`${properties.shouldBeDisabled ? "opacity-50" : ""} w-full flex hover:bg-slate-950`}
      style={{ height: `${BUTTON_HEIGHT}rem` }}
      onClick={properties.clickHandler}
      disabled={properties.shouldBeDisabled}
      hotkeys={[`Digit${number}`]}
    >
      <div
        className="h-full w-10 !min-w-[2.5rem] border-r border-slate-400
            flex items-center justify-center animate-slide-appear-from-left-fast"
      >
        {number}
      </div>
      {/* @TODO - these classnames were from when we only used text, transfer them to the appropriate menu state 
      button properties constructor calls
      */}
      <div className="pl-2 w-full h-full flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis">
        {properties.jsx}
      </div>
    </HotkeyButton>
  );
}

export function NumberedButtonBody({ children }: { children: ReactNode }) {
  <div className="h-full w-full">{children}</div>;
}
