import { useUIStore } from "@/stores/ui-store";
import React from "react";
import { FocusEventHandler, MouseEventHandler, useEffect, useRef } from "react";

interface Props {
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
  hotkeys?: string[];
  buttonType?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
}

export default function HotkeyButton(props: Props) {
  const hotkeysDisabled = useUIStore().hotkeysDisabled;
  const onClick = typeof props.onClick !== "undefined" ? props.onClick : () => {};
  const onFocus = typeof props.onFocus !== "undefined" ? props.onFocus : () => {};
  const onBlur = typeof props.onFocus !== "undefined" ? props.onFocus : () => {};
  const keypressListenerRef = useRef<(e: KeyboardEvent) => void | null>();

  useEffect(() => {
    if (props.hotkeys !== undefined) {
      keypressListenerRef.current = (e: KeyboardEvent) => {
        for (const hotkey of props.hotkeys!) {
          if (e.code === hotkey && !hotkeysDisabled && !props.disabled) {
            console.log("hotkey pressed: ", hotkey)
            // @ts-ignore
            onClick(new MouseEvent("mouseup"));
          }
        }
      };
      window.addEventListener("keydown", keypressListenerRef.current);
    }
    return () => {
      if (keypressListenerRef.current)
        window.removeEventListener("keydown", keypressListenerRef.current);
    };
  }, [onClick, hotkeysDisabled]);

  return (
    <button
      type={props.buttonType || "button"}
      disabled={props.disabled || false}
      className={`${props.className}`}
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-label={props.ariaLabel}
    >
      {props.children}
    </button>
  );
}
