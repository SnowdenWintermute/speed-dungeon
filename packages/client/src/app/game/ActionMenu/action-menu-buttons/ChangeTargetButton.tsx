import React, { useEffect, useRef } from "react";
import {
  ActionMenuButtonProperties,
  GAME_KEYS_TO_KEYPRESS_CODES,
  GAME_KEYS_TO_KEYUP_CODES,
  GameKey,
} from "../action-menu-button-properties";
import { BUTTON_HEIGHT_SMALL } from "@/client_consts";
import { setAlert } from "@/app/components/alerts";

interface Props {
  properties: ActionMenuButtonProperties;
}

export default function ChangeTargetButton({ properties }: Props) {
  const keyupHandlerRef = useRef<(e: KeyboardEvent) => void | null>();
  const keypressHandlerRef = useRef<(e: KeyboardEvent) => void | null>();

  useEffect(() => {
    keypressHandlerRef.current = (e: KeyboardEvent) =>
      createKeyHandler(properties, GAME_KEYS_TO_KEYPRESS_CODES, e);
    window.addEventListener("keypress", keypressHandlerRef.current);

    return () => {
      if (keypressHandlerRef.current)
        window.removeEventListener("keypress", keypressHandlerRef.current);
    };
  }, [properties.clickHandler]);

  useEffect(() => {
    keyupHandlerRef.current = (e: KeyboardEvent) =>
      createKeyHandler(properties, GAME_KEYS_TO_KEYUP_CODES, e);
    window.addEventListener("keyup", keyupHandlerRef.current);

    return () => {
      if (keyupHandlerRef.current) window.removeEventListener("keyup", keyupHandlerRef.current);
    };
  }, [properties.clickHandler]);

  const dedicatedKey = properties.dedicatedKeysOption
    ? properties.dedicatedKeysOption[0] ?? null
    : null;

  let text = "";

  switch (dedicatedKey) {
    case GameKey.Next:
      text = "Next target (E)";
      break;
    case GameKey.Previous:
      text = "Previous target (W)";
      break;
    default:
  }
  return (
    <button
      className="pr-2 pl-2 pointer-events-auto"
      style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}
      onClick={properties.clickHandler}
      onMouseEnter={properties.mouseEnterHandler}
      onMouseLeave={properties.mouseLeaveHandler}
      onFocus={properties.focusHandler}
      onBlur={properties.blurHandler}
      disabled={properties.shouldBeDisabled}
    >
      <span className="flex-grow h-full flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis pr-2 pl-2 ">
        {text}
      </span>
    </button>
  );
}

function createKeyHandler(
  properties: ActionMenuButtonProperties,
  codes: Partial<Record<GameKey, string[]>>,
  e: KeyboardEvent
) {
  if (properties.shouldBeDisabled) return;
  if (properties.dedicatedKeysOption === null)
    return setAlert(`no keycode found for button ${properties.text}`);

  for (const key of properties.dedicatedKeysOption) {
    if (codes[key]?.includes(e.code)) {
      // @ts-ignore
      properties.clickHandler(new MouseEvent("mouseup"));
      break;
    }
  }
}
