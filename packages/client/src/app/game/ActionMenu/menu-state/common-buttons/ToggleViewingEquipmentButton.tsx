import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { AppStore } from "@/mobx-stores/app-store";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { MenuStateType } from "../menu-state-type";

export default function ToggleViewingEquipmentButton() {
  const { hotkeysStore, actionMenuStore, focusStore } = AppStore.get();
  const buttonType = HotkeyButtonTypes.ToggleViewEquipment;
  const viewEquipmentHotkeys = hotkeysStore.getKeybind(buttonType);

  return (
    <ActionMenuTopButton
      hotkeys={viewEquipmentHotkeys}
      handleClick={() => {
        focusStore.detailables.clear();
        actionMenuStore.pushStack(MenuStatePool.get(MenuStateType.ViewingEquipedItems));
      }}
    >
      Equipped ({hotkeysStore.getKeybindString(buttonType)})
    </ActionMenuTopButton>
  );
}
