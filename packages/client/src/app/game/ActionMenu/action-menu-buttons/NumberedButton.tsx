import React from "react";
import { BUTTON_HEIGHT } from "@/client_consts";
import { ActionMenuButtonProperties } from "../menu-state";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";

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
      <span
        className="h-full w-10 !min-w-[2.5rem] border-r border-slate-400
            flex items-center justify-center mr-2 animate-slide-appear-from-left-fast"
      >
        {number}
      </span>
      <span className="flex-grow h-full flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis">
        {properties.text}
      </span>
    </HotkeyButton>
  );
}
