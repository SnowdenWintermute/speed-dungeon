import { FocusEventHandler, MouseEventHandler, useEffect, useRef } from "react";
import HotkeyButton from "./HotkeyButton";

interface Props {
  extraStyles?: string;
  children: React.ReactNode;
  hotkey?: string;
  buttonType?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
}

export default function ButtonBasic(props: Props) {
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
    <HotkeyButton
      buttonType={props.buttonType || "button"}
      disabled={props.disabled || false}
      className={`
      border border-slate-400 h-10 cursor-pointer pr-4 pl-4 
      flex justify-center items-center disabled:opacity-50
      pointer-events-auto
      disabled:cursor-auto ${props.extraStyles}
      `}
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {props.children}
    </HotkeyButton>
  );
}
