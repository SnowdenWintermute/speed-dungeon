import React, { useEffect, useRef } from "react";
import { ActionMenuButtonProperties } from "../action-menu-button-properties";
import { BUTTON_HEIGHT } from "@/client_consts";

interface Props {
  number: number;
  properties: ActionMenuButtonProperties;
}

export default function NumberedButton({ number, properties }: Props) {
  const keyupHandlerRef = useRef<(e: KeyboardEvent) => void | null>();

  useEffect(() => {
    keyupHandlerRef.current = (e: KeyboardEvent) => {
      if (e.code === `Digit${number}`) {
        // @ts-ignore
        properties.clickHandler(new MouseEvent("mouseup"));
      }
    };
    window.addEventListener("keypress", keyupHandlerRef.current);

    return () => {
      if (keyupHandlerRef.current) window.removeEventListener("keypress", keyupHandlerRef.current);
    };
  }, [properties.clickHandler]);

  const disabledStyle = properties.shouldBeDisabled ? "opacity-50" : "";

  return (
    <button
      className={`${disabledStyle} w-full border-b border-r border-l first:border-t border-slate-400 bg-slate-700 flex hover:bg-slate-950 disabled:opacity-50`}
      style={{ height: `${BUTTON_HEIGHT}rem` }}
      onClick={properties.clickHandler}
      onMouseEnter={properties.mouseEnterHandler}
      onMouseLeave={properties.mouseLeaveHandler}
      onFocus={properties.focusHandler}
      onBlur={properties.blurHandler}
      disabled={properties.shouldBeDisabled}
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
    </button>
  );
}
