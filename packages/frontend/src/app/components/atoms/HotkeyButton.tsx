import React from "react";
import { FocusEventHandler, MouseEventHandler, PointerEventHandler, useEffect, useRef } from "react";
import { normalizeKeyValue } from "@speed-dungeon/common";
import { useHotkeysDisabled } from "./ui-context";

interface Props {
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
  ariaDisabled?: boolean;
  hotkeys?: string[];
  style?: React.CSSProperties;
  buttonType?: "button" | "submit" | "reset";
  disabled?: boolean;
  alwaysEnabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  onMouseEnter?: MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: MouseEventHandler<HTMLButtonElement>;
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
  keyUp?: boolean;
}

export function HotkeyButton(props: Props) {
  const hotkeysDisabled = useHotkeysDisabled();
  const keydownListenerRef = useRef<(e: KeyboardEvent) => void | null>(null);
  const disabled = props.alwaysEnabled === true ? false : props.disabled || hotkeysDisabled;
  const listenerType = props.keyUp ? "keyup" : "keydown";

  useEffect(() => {
    if (props.hotkeys !== undefined) {
      keydownListenerRef.current = (e: KeyboardEvent) => {
        for (const hotkey of props.hotkeys!) {
          if (
            normalizeKeyValue(e.key) === normalizeKeyValue(hotkey) &&
            !disabled &&
            !props.ariaDisabled
          ) {
            // consume the keystroke so it can't also be typed into an input that this
            // action focuses (e.g. opening a modal whose field auto-focuses)
            e.preventDefault();
            //@ts-ignore
            props.onClick(new MouseEvent("mouseup"));
          }
        }
      };

      window.addEventListener(listenerType, keydownListenerRef.current);
    }

    return () => {
      if (keydownListenerRef.current) {
        window.removeEventListener(listenerType, keydownListenerRef.current);
      }
    };
  }, [props.onClick, hotkeysDisabled, disabled, listenerType, props.hotkeys]);

  return (
    <button
      type={props.buttonType || "button"}
      disabled={disabled}
      aria-disabled={props.ariaDisabled}
      className={`${props.className}`}
      onClick={props.onClick}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      aria-label={props.ariaLabel}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      onPointerDown={props.onPointerDown}
      style={props.style}
    >
      {props.children}
    </button>
  );
}
