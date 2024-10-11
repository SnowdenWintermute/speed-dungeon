import React from "react";
import { FocusEventHandler, MouseEventHandler, useEffect, useRef } from "react";

interface Props {
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
  hotkey?: string;
  buttonType?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
}

export default function HotkeyButton(props: Props) {
  const onClick = typeof props.onClick !== "undefined" ? props.onClick : () => {};
  const onFocus = typeof props.onFocus !== "undefined" ? props.onFocus : () => {};
  const onBlur = typeof props.onFocus !== "undefined" ? props.onFocus : () => {};
  const keypressListenerRef = useRef<(e: KeyboardEvent) => void | null>();

  useEffect(() => {
    if (props.hotkey !== undefined) {
      keypressListenerRef.current = (e: KeyboardEvent) => {
        if (e.code === props.hotkey) {
          // @ts-ignore
          onClick(new MouseEvent("mouseup"));
        }
      };
      window.addEventListener("keyup", keypressListenerRef.current);
    }
    return () => {
      if (keypressListenerRef.current)
        window.removeEventListener("keyup", keypressListenerRef.current);
    };
  }, [onClick]);

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
