import React, { ReactNode } from "react";
import { ACTION_MENU_GENERAL_BUTTON_STYLE, ACTION_MENU_TOP_BUTTON_STYLE } from "./common-styles";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";

export default function ActionMenuTopButton({
  extraStyles,
  handleClick,
  hotkeys,
  disabled,
  children,
}: {
  extraStyles?: string;
  handleClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  hotkeys?: string[];
}) {
  return (
    <HotkeyButton
      className={`${ACTION_MENU_GENERAL_BUTTON_STYLE} ${ACTION_MENU_TOP_BUTTON_STYLE} ${extraStyles} border-slate-400 bg-slate-700 pr-2 pl-2 flex items-center`}
      onClick={handleClick}
      hotkeys={hotkeys || []}
      disabled={disabled}
    >
      {children}
    </HotkeyButton>
  );
}
