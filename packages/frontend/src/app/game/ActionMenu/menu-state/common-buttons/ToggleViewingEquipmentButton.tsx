import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";
import { observer } from "mobx-react-lite";
import { ActionMenuScreenType } from "@/client-application/action-menu/screen-types";

export const ToggleViewingEquipmentButton = observer(() => {
  const clientApplication = useClientApplication();
  const { uiStore, actionMenu, detailableEntityFocus } = clientApplication;
  const buttonType = HotkeyButtonTypes.ToggleViewEquipment;
  const viewEquipmentHotkeys = uiStore.keybinds.getKeybind(buttonType);

  return (
    <ActionMenuTopButton
      hotkeys={viewEquipmentHotkeys}
      handleClick={() => {
        detailableEntityFocus.detailables.clear();
        actionMenu.clearStack();
        actionMenu.pushFromPool(ActionMenuScreenType.ViewingEquipedItems);
      }}
    >
      Equipped ({uiStore.keybinds.getKeybindString(buttonType)})
    </ActionMenuTopButton>
  );
});
