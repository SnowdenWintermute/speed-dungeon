import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { AppStore } from "@/mobx-stores/app-store";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { websocketConnection } from "@/singletons/websocket-connection";
import { ClientToServerEvent } from "@speed-dungeon/common";
import React from "react";
import { MenuStateType } from "../menu-state-type";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { observer } from "mobx-react-lite";

export const ToggleAttributeAllocationMenuHiddenButton = observer(() => {
  const { hotkeysStore, actionMenuStore, gameStore } = AppStore.get();
  const entityId = gameStore.getExpectedFocusedCharacterId();

  function clickHandler() {
    websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
      characterId: entityId,
      actionAndRankOption: null,
    });

    if (actionMenuStore.currentMenuIsType(MenuStateType.AssignAttributePoints)) {
      actionMenuStore.popStack();
    } else {
      gameStore.setFocusedCharacter(entityId);
      actionMenuStore.replaceStack([MenuStatePool.get(MenuStateType.AssignAttributePoints)]);
    }
  }

  const buttonType = HotkeyButtonTypes.ToggleAssignAttributesMenu;

  return (
    <HotkeyButton
      onClick={clickHandler}
      hotkeys={hotkeysStore.getKeybind(buttonType)}
      className="hidden"
      children=""
    />
  );
});
