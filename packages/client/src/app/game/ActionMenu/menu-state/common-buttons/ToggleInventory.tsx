import React from "react";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { MenuStateType } from "../menu-state-type";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";

const { hotkeys } = AppStore.get();
const buttonHotkeys = hotkeys.getKeybind(HotkeyButtonTypes.ToggleInventory);
const buttonHotkeysString = hotkeys.getKeybindString(HotkeyButtonTypes.ToggleInventory);

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
      hotkeys={buttonHotkeys}
    >
      <span className="flex-grow h-full flex items-center justify-center whitespace-nowrap overflow-hidden overflow-ellipsis ">
        {`Inventory (${buttonHotkeysString})`}
      </span>
    </ActionMenuTopButton>
  );
}
