import React, { ReactNode } from "react";
import { BUTTON_HEIGHT } from "@/client_consts";
import { ActionMenuButtonProperties } from "../menu-state";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { useUIStore } from "@/stores/ui-store";

interface Props {
  number: number;
  properties: ActionMenuButtonProperties;
  extraStyles?: string;
}

export default function NumberedButton({ number, properties, extraStyles }: Props) {
  const alternateClickKeyHeld = useUIStore().alternateClickKeyHeld;

  const clickHandler = (() => {
    if (properties.shouldBeDisabled) return () => {};
    else if (alternateClickKeyHeld) return properties.alternateClickHandler;
    else return properties.clickHandler;
  })();

  return (
    <HotkeyButton
      className={`w-full flex hover:bg-slate-950
                  border-b border-l border-r ${extraStyles}
                 `}
      style={{ height: `${BUTTON_HEIGHT}rem` }}
      onClick={clickHandler}
      hotkeys={[`Digit${number}`]}
      onMouseEnter={properties.mouseEnterHandler}
      onMouseLeave={properties.mouseLeaveHandler}
      onFocus={properties.focusHandler}
      onBlur={properties.blurHandler}
    >
      <div className={`flex h-full w-full`}>
        <div
          className={`h-full w-10 !min-w-[2.5rem] border-r border-slate-400
            flex items-center justify-center animate-slide-appear-from-left-fast
            `}
        >
          <span className={properties.shouldBeDisabled ? "opacity-50" : ""}>{number}</span>
        </div>
        {/* @TODO - these classnames were from when we only used text, transfer them to the appropriate menu state 
      button properties constructor calls
      */}
        <div
          className={`
          pl-2 w-full h-full flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis
          ${properties.shouldBeDisabled ? "opacity-50" : ""}
          `}
        >
          {properties.jsx()}
        </div>
      </div>
    </HotkeyButton>
  );
}

export function NumberedButtonBody({ children }: { children: ReactNode }) {
  <div className="h-full w-full">{children}</div>;
}
