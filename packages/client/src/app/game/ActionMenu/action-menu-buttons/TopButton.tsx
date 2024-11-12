import React, { useEffect, useRef } from "react";
import { BUTTON_HEIGHT_SMALL } from "@/client_consts";
import { ActionMenuButtonProperties } from "../menu-state";

interface Props {
  properties: ActionMenuButtonProperties;
}

export default function TopButton({ properties }: Props) {
  const keydownHandlerRef = useRef<(e: KeyboardEvent) => void | null>();
  const keypressHandlerRef = useRef<(e: KeyboardEvent) => void | null>();

  useEffect(() => {
    keypressHandlerRef.current = (e: KeyboardEvent) => createKeyHandler(properties, e, "keypress");
    window.addEventListener("keypress", keypressHandlerRef.current);

    keydownHandlerRef.current = (e: KeyboardEvent) => createKeyHandler(properties, e, "keydown");
    window.addEventListener("keydown", keydownHandlerRef.current);

    return () => {
      if (keydownHandlerRef.current)
        window.removeEventListener("keydown", keydownHandlerRef.current);
      if (keypressHandlerRef.current)
        window.removeEventListener("keypress", keypressHandlerRef.current);
    };
  }, [properties.clickHandler]);

  return (
    <button
      className="w-full border border-slate-400 bg-slate-700 flex hover:bg-slate-950 disabled:opacity-50 max-w-fit whitespace-nowrap text-ellipsis overflow-hidden mr-2 last:mr-0 pointer-events-auto"
      style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}
      onClick={properties.clickHandler}
      onMouseEnter={properties.mouseEnterHandler}
      onMouseLeave={properties.mouseLeaveHandler}
      onFocus={properties.focusHandler}
      onBlur={properties.blurHandler}
      disabled={properties.shouldBeDisabled}
    >
      <span className="flex-grow h-full flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis pr-2 pl-2 ">
        {properties.text}
      </span>
    </button>
  );
}

export function createKeyHandler(
  properties: ActionMenuButtonProperties,
  e: KeyboardEvent,
  type: "keydown" | "keypress"
) {
  if (type === "keydown" && e.code !== "Escape" && e.code !== "Enter") return;
  if (properties.shouldBeDisabled) return;

  for (const key of properties.dedicatedKeys) {
    if (key === e.code) {
      // @ts-ignore
      properties.clickHandler(new MouseEvent("mouseup"));
      break;
    }
  }
}
