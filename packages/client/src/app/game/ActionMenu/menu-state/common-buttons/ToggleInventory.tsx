import React from "react";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { MenuStateType } from "../menu-state-type";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";

const { hotkeysStore } = AppStore.get();
const buttonHotkeys = hotkeysStore.getKeybind(HotkeyButtonTypes.ToggleInventory);
const buttonHotkeysString = hotkeysStore.getKeybindString(HotkeyButtonTypes.ToggleInventory);

export default function ToggleInventoryButton() {
  return (
    <ActionMenuTopButton
      handleClick={() => {
        const { actionMenuStore, focusStore } = AppStore.get();
        focusStore.combatantAbilities.clear();
        focusStore.detailables.clearHovered();

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
