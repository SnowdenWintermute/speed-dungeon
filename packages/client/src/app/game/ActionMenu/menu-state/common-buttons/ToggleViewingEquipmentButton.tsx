import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { ActionMenuScreenPool } from "@/mobx-stores/action-menu/menu-state-pool";
import { ActionMenuScreenType } from "../menu-state-type";

export default function ToggleViewingEquipmentButton() {
  const { hotkeysStore, actionMenuStore, focusStore } = AppStore.get();
  const buttonType = HotkeyButtonTypes.ToggleViewEquipment;
  const viewEquipmentHotkeys = hotkeysStore.getKeybind(buttonType);

  return (
    <ActionMenuTopButton
      hotkeys={viewEquipmentHotkeys}
      handleClick={() => {
        focusStore.detailables.clear();
        actionMenuStore.pushStack(ActionMenuScreenPool.get(ActionMenuScreenType.ViewingEquipedItems));
      }}
    >
      Equipped ({hotkeysStore.getKeybindString(buttonType)})
    </ActionMenuTopButton>
  );
}
