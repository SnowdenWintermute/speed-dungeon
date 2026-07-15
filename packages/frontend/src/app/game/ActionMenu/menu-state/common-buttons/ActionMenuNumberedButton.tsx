import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { BUTTON_HEIGHT } from "@/client-consts";
import { observer } from "mobx-react-lite";
import React, { CSSProperties, PointerEventHandler, ReactNode } from "react";
import NumberedButtonHotkeyLabel from "./NumberedButtonHotkeyLabel";

interface Props {
  children: ReactNode;
  hotkeys: string[];
  hotkeyLabel: string;
  extraStyles?: string;
  style?: CSSProperties;
  disabled?: boolean;
  clickHandler: () => void;
  focusHandler?: () => void;
  blurHandler?: () => void;
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
  pointerEventsDisabled?: boolean;
}

export const ActionMenuNumberedButton = observer((props: Props) => {
  const { children, clickHandler, focusHandler, blurHandler, hotkeys, disabled } = props;
  const pointerEventsClass = props.pointerEventsDisabled
    ? "pointer-events-none"
    : "pointer-events-auto";

  return (
    <HotkeyButton
      onFocus={focusHandler}
      onMouseEnter={focusHandler}
      onBlur={blurHandler}
      onMouseLeave={blurHandler}
      ariaDisabled={disabled ? true : undefined}
      hotkeys={hotkeys}
      onPointerDown={props.onPointerDown}
      className={`${props.extraStyles} w-full flex bg-slate-700 hover:bg-slate-950 border-b border-l border-r border-slate-400 ${pointerEventsClass} `}
      style={{ height: `${BUTTON_HEIGHT}rem`, ...props.style }}
      onClick={() => {
        if (!disabled) {
          clickHandler();
        }
      }}
    >
      {props.hotkeyLabel && (
        <NumberedButtonHotkeyLabel hotkeyLabel={props.hotkeyLabel} isDisabled={!!disabled} />
      )}
      {children}
    </HotkeyButton>
  );
});
