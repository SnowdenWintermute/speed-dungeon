import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { BUTTON_HEIGHT } from "@/client_consts";
import { observer } from "mobx-react-lite";
import React, { ReactNode } from "react";
import NumberedButtonHotkeyLabel from "./NumberedButtonHotkeyLabel";

interface Props {
  children: ReactNode;
  hotkeys: string[];
  hotkeyLabel: string;
  extraStyles: string;
  disabled?: boolean;
  focusHandler: () => void;
  blurHandler: () => void;
  clickHandler: () => void;
}

export const ActionMenuNumberedButton = observer((props: Props) => {
  const { children, clickHandler, focusHandler, blurHandler, hotkeys, disabled } = props;

  return (
    <HotkeyButton
      onFocus={focusHandler}
      onMouseEnter={focusHandler}
      onBlur={blurHandler}
      onMouseLeave={blurHandler}
      disabled={disabled}
      hotkeys={hotkeys}
      className={`${props.extraStyles} w-full flex bg-slate-700 hover:bg-slate-950 border-b border-l border-r border-slate-400 pointer-events-auto `}
      style={{ height: `${BUTTON_HEIGHT}rem` }}
      onClick={clickHandler}
    >
      <NumberedButtonHotkeyLabel hotkeyLabel={props.hotkeyLabel} isDisabled={!!disabled} />
      {children}
    </HotkeyButton>
  );
});
