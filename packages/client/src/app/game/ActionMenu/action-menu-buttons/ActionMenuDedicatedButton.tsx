import React from "react";
import { BUTTON_HEIGHT_SMALL } from "@/client_consts";
import { ActionMenuButtonProperties } from "../menu-state";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";

interface Props {
  properties: ActionMenuButtonProperties;
  extraStyles?: string;
}

export default function ActionMenuDedicatedButton({ properties, extraStyles }: Props) {
  return (
    <HotkeyButton
      className={`${extraStyles}
      bg-slate-700 flex hover:bg-slate-950 disabled:opacity-50 
      whitespace-nowrap text-ellipsis overflow-hidden pointer-events-auto`}
      style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}
      onClick={properties.clickHandler}
      onMouseEnter={properties.mouseEnterHandler}
      onMouseLeave={properties.mouseLeaveHandler}
      onFocus={properties.focusHandler}
      onBlur={properties.blurHandler}
      disabled={properties.shouldBeDisabled}
      hotkeys={properties.dedicatedKeys}
    >
      <span className="flex-grow h-full flex items-center justify-center whitespace-nowrap overflow-hidden overflow-ellipsis pr-2 pl-2 ">
        {properties.text}
      </span>
    </HotkeyButton>
  );
}