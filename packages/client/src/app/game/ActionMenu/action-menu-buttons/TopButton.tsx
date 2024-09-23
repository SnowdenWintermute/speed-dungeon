import React, { useEffect, useRef } from "react";
import {
  ActionMenuButtonProperties,
  GAME_KEYS_TO_KEYPRESS_CODES,
  GAME_KEYS_TO_KEYUP_CODES,
  GameKey,
  formatGameKey,
} from "../action-menu-button-properties";
import { BUTTON_HEIGHT_SMALL } from "@/client_consts";
import { setAlert } from "@/app/components/alerts";
import { AlertState, useAlertStore } from "@/stores/alert-store";
import { MutateState } from "@/stores/mutate-state";

interface Props {
  properties: ActionMenuButtonProperties;
}

export default function TopButton({ properties }: Props) {
  const mutateAlertState = useAlertStore().mutateState;
  const keyupHandlerRef = useRef<(e: KeyboardEvent) => void | null>();
  const keypressHandlerRef = useRef<(e: KeyboardEvent) => void | null>();

  useEffect(() => {
    keypressHandlerRef.current = (e: KeyboardEvent) =>
      createKeyHandler(properties, mutateAlertState, GAME_KEYS_TO_KEYPRESS_CODES, e);
    window.addEventListener("keypress", keypressHandlerRef.current);

    return () => {
      if (keypressHandlerRef.current)
        window.removeEventListener("keypress", keypressHandlerRef.current);
    };
  }, [properties.clickHandler]);

  useEffect(() => {
    keyupHandlerRef.current = (e: KeyboardEvent) =>
      createKeyHandler(properties, mutateAlertState, GAME_KEYS_TO_KEYUP_CODES, e);
    window.addEventListener("keyup", keyupHandlerRef.current);

    return () => {
      if (keyupHandlerRef.current) window.removeEventListener("keyup", keyupHandlerRef.current);
    };
  }, [properties.clickHandler]);

  const keyToShow = properties.dedicatedKeysOption ? properties.dedicatedKeysOption[0] : null;
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
        {" " + "(" + formatGameKey(keyToShow) + ")"}
      </span>
    </button>
  );
}

export function createKeyHandler(
  properties: ActionMenuButtonProperties,
  mutateAlertState: MutateState<AlertState>,
  codes: Partial<Record<GameKey, string[]>>,
  e: KeyboardEvent
) {
  if (properties.shouldBeDisabled) return;
  if (properties.dedicatedKeysOption === null)
    return setAlert(mutateAlertState, `no keycode found for button ${properties.text}`);

  for (const key of properties.dedicatedKeysOption) {
    if (codes[key]?.includes(e.code)) {
      // @ts-ignore
      properties.clickHandler(new MouseEvent("mouseup"));
      break;
    }
  }
}
