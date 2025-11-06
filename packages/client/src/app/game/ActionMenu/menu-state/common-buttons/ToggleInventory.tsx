import React from "react";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { MenuStateType } from "../menu-state-type";
import ActionMenuTopButton from "./ActionMenuTopButton";

const toggleInventoryMainHotkey = HOTKEYS.MAIN_1;
export const toggleInventoryHotkeys = [toggleInventoryMainHotkey, "KeyI"];

export default function ToggleInventoryButton() {
  return (
    <ActionMenuTopButton
      handleClick={() => {
        const { actionMenuStore } = AppStore.get();
        actionMenuStore.clearHoveredAction();
        if (actionMenuStore.getCurrentMenu().type === MenuStateType.InventoryItems) {
          actionMenuStore.popStack();
        } else {
          const inventoryItemsMenu = MenuStatePool.get(MenuStateType.InventoryItems);
          actionMenuStore.pushStack(inventoryItemsMenu);
        }
      }}
      hotkeys={toggleInventoryHotkeys}
    >
      <span className="flex-grow h-full flex items-center justify-center whitespace-nowrap overflow-hidden overflow-ellipsis ">
        {`Inventory (${letterFromKeyCode(toggleInventoryMainHotkey)})`}
      </span>
    </ActionMenuTopButton>
  );
}
