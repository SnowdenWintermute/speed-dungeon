import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";
import { ActionMenuScreenType } from "@/client-application/action-menu/screen-types";
import { observer } from "mobx-react-lite";

export const OpenInventoryAsFreshStackButton = observer(() => {
  const clientApplication = useClientApplication();
  const { uiStore, actionMenu, detailableEntityFocus } = clientApplication;
  const { keybinds } = uiStore;
  const buttonHotkeys = keybinds.getKeybind(HotkeyButtonTypes.ToggleInventory);
  const buttonHotkeysString = keybinds.getKeybindString(HotkeyButtonTypes.ToggleInventory);

  return (
    <ActionMenuTopButton
      hotkeys={buttonHotkeys}
      handleClick={() => {
        detailableEntityFocus.combatantAbilities.clear();
        actionMenu.clearStack();
        actionMenu.pushFromPool(ActionMenuScreenType.InventoryItems);
      }}
    >
      Inventory ({buttonHotkeysString})
    </ActionMenuTopButton>
  );
});
