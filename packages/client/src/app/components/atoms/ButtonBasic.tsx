import { FocusEventHandler, MouseEventHandler } from "react";

interface Props {
  extraStyles: string;
  children: React.ReactNode;
  buttonType?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
}

export default function ButtonBasic(props: Props) {
  const onClick =
    typeof props.onClick !== "undefined" ? props.onClick : () => {};
  const onFocus =
    typeof props.onFocus !== "undefined" ? props.onFocus : () => {};
  const onBlur =
    typeof props.onFocus !== "undefined" ? props.onFocus : () => {};
  return (
    <button
      type={props.buttonType || "button"}
      disabled={props.disabled || false}
      className={`
      border border-slate-400 h-10 cursor-pointer pr-4 pl-4 
      flex justify-center items-center disabled:opacity-50
      disabled:cursor-auto ${props.extraStyles}
      `}
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {props.children}
    </button>
  );
}
