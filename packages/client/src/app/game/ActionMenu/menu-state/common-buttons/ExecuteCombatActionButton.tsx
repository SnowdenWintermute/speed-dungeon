import { observer } from "mobx-react-lite";
import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { AppStore } from "@/mobx-stores/app-store";
import { websocketConnection } from "@/singletons/websocket-connection";
import { ClientToServerEvent } from "@speed-dungeon/common";

function clickHandler() {
  const { gameStore, focusStore, actionMenuStore } = AppStore.get();
  const characterId = gameStore.getExpectedFocusedCharacterId();
  websocketConnection.emit(ClientToServerEvent.UseSelectedCombatAction, {
    characterId,
  });

  actionMenuStore.clearStack(); // don't just pop because could have used item from inventory
  actionMenuStore.getCurrentMenu().goToFirstPage();
  focusStore.detailables.clear();

  const party = gameStore.getExpectedParty();

  const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
  focusedCharacter.getTargetingProperties().setSelectedActionAndRank(null);
  party.inputLock.lockInput();
}

export const ExecuteCombatActionButton = observer(() => {
  const { gameStore, hotkeysStore } = AppStore.get();
  const userControlsThisCharacter = gameStore.clientUserControlsFocusedCombatant();
  const shouldBeDisabled = !userControlsThisCharacter;

  const buttonType = HotkeyButtonTypes.Confirm;

  return (
    <ActionMenuTopButton
      disabled={shouldBeDisabled}
      hotkeys={hotkeysStore.getKeybind(buttonType)}
      handleClick={clickHandler}
    >
      Execute ({hotkeysStore.getKeybindString(buttonType)})
    </ActionMenuTopButton>
  );
});
