import React from "react";
import { BUTTON_HEIGHT } from "@/client_consts";
import { ActionMenuButtonProperties } from "../menu-state";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";

interface Props {
  number: number;
  properties: ActionMenuButtonProperties;
}

export default function NumberedButton({ number, properties }: Props) {
  const disabledStyle = properties.shouldBeDisabled ? "opacity-50" : "";

  return (
    <HotkeyButton
      className={`${disabledStyle} w-full border-b border-r border-l first:border-t border-slate-400 bg-slate-700 flex hover:bg-slate-950 disabled:opacity-50`}
      style={{ height: `${BUTTON_HEIGHT}rem` }}
      onClick={properties.clickHandler}
      onMouseEnter={properties.mouseEnterHandler}
      onMouseLeave={properties.mouseLeaveHandler}
      onFocus={properties.focusHandler}
      onBlur={properties.blurHandler}
      disabled={properties.shouldBeDisabled}
      hotkeys={[`Digit${number}`]}
    >
      <span
        className="h-full w-10 !min-w-[2.5rem] border-r border-slate-400
            flex items-center justify-center mr-2"
      >
        {number}
      </span>
      <span className="flex-grow h-full flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis">
        {properties.text}
      </span>
    </HotkeyButton>
  );
}
