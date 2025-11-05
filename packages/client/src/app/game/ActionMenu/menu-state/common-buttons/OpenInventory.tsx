import React from "react";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { MenuStateType } from "../menu-state-type";
import { ACTION_MENU_GENERAL_BUTTON_STYLE, ACTION_MENU_TOP_BUTTON_STYLE } from "./common-styles";

export const toggleInventoryHotkey = HOTKEYS.MAIN_1;

export default function OpenInventoryButton() {
  return (
    <HotkeyButton
      className={`${ACTION_MENU_GENERAL_BUTTON_STYLE} ${ACTION_MENU_TOP_BUTTON_STYLE} border-slate-400 bg-slate-700`}
      onClick={() => {
        const { actionMenuStore } = AppStore.get();
        actionMenuStore.clearHoveredAction();
        const inventoryItemsMenu = MenuStatePool.get(MenuStateType.InventoryItems);
        actionMenuStore.pushStack(inventoryItemsMenu);
      }}
      hotkeys={[]}
    >
      <span className="flex-grow h-full flex items-center justify-center whitespace-nowrap overflow-hidden overflow-ellipsis pr-2 pl-2 ">
        {`Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`}
      </span>
    </HotkeyButton>
  );
}
