import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { AppStore } from "@/mobx-stores/app-store";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { MenuStateType } from "../menu-state-type";

const { hotkeysStore } = AppStore.get();
const buttonHotkeys = hotkeysStore.getKeybind(HotkeyButtonTypes.ToggleInventory);
const buttonHotkeysString = hotkeysStore.getKeybindString(HotkeyButtonTypes.ToggleInventory);

export default function OpenInventoryAsFreshStackButton() {
  return (
    <ActionMenuTopButton
      hotkeys={buttonHotkeys}
      handleClick={() => {
        const { actionMenuStore, focusStore } = AppStore.get();
        focusStore.combatantAbilities.clear();
        actionMenuStore.replaceStack([MenuStatePool.get(MenuStateType.InventoryItems)]);
      }}
    >
      Inventory ({buttonHotkeysString})
    </ActionMenuTopButton>
  );
}
