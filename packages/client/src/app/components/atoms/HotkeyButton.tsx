import { AppStore } from "@/mobx-stores/app-store";
import { observer } from "mobx-react-lite";
import React from "react";
import { FocusEventHandler, MouseEventHandler, useEffect, useRef } from "react";

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
  keyUp?: boolean;
}

export const HotkeyButton = observer((props: Props) => {
  const hotkeysDisabled = AppStore.get().inputStore.getHotkeysDisabled();
  const keydownListenerRef = useRef<(e: KeyboardEvent) => void | null>(null);
  const disabled = props.alwaysEnabled === true ? false : props.disabled || hotkeysDisabled;
  const listenerType = props.keyUp ? "keyup" : "keydown";

  useEffect(() => {
    if (props.hotkeys !== undefined) {
      keydownListenerRef.current = (e: KeyboardEvent) => {
        for (const hotkey of props.hotkeys!) {
          if (e.code === hotkey && !disabled && !props.ariaDisabled) {
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
      style={props.style}
    >
      {props.children}
    </button>
  );
});
