import React from "react";
import { ActionMenuButtonProperties } from "./menu-state/action-menu-button-properties";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";

export default function ActionMenuHiddenButtons({
  buttonProperties,
}: {
  buttonProperties: ActionMenuButtonProperties[];
}) {
  return (
    <ul className="hidden">
      {buttonProperties.map((button, i) => (
        <li key={button.key}>
          <HotkeyButton hotkeys={button.dedicatedKeys} onClick={button.clickHandler}>
            <></>
          </HotkeyButton>
        </li>
      ))}
    </ul>
  );
}
