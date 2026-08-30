import React from "react";
import { FocusEventHandler, MouseEventHandler, PointerEventHandler } from "react";
import { useHotkeysDisabled } from "../ui-context";
import { useHotkeys } from "../hooks/use-hotkeys";

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
  const disabled = props.alwaysEnabled === true ? false : props.disabled || hotkeysDisabled;

  useHotkeys({
    hotkeys: props.hotkeys,
    disabled: disabled || props.ariaDisabled === true,
    keyUp: props.keyUp,
    onActivate: () => {
      //@ts-ignore
      props.onClick(new MouseEvent("mouseup"));
    },
  });

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
