import React from "react";
import { useClientApplication } from "@/hooks/create-client-application-context";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";
import { ActionMenuScreenType } from "@/client-application/action-menu/screen-types";

export default function ToggleInventoryButton() {
  const clientApplication = useClientApplication();
  const { uiStore, actionMenu, detailableEntityFocus } = clientApplication;
  const { keybinds } = uiStore;
  const buttonHotkeys = keybinds.getKeybind(HotkeyButtonTypes.ToggleInventory);
  const buttonHotkeysString = keybinds.getKeybindString(HotkeyButtonTypes.ToggleInventory);
  return (
    <ActionMenuTopButton
      handleClick={() => {
        detailableEntityFocus.combatantAbilities.clear();
        detailableEntityFocus.detailables.clearHovered();

        if (actionMenu.getCurrentMenu().type === ActionMenuScreenType.InventoryItems) {
          actionMenu.popStack();
        } else {
          actionMenu.pushFromPool(ActionMenuScreenType.InventoryItems);
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
