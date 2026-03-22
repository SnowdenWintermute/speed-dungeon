import { observer } from "mobx-react-lite";
import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ClientIntentType } from "@speed-dungeon/common";
import { gameClientSingleton } from "@/singletons/lobby-client";

function clickHandler() {
  const { gameStore, focusStore, actionMenuStore } = AppStore.get();
  const characterId = gameStore.getExpectedFocusedCharacterId();
  gameClientSingleton.get().dispatchIntent({
    type: ClientIntentType.UseSelectedCombatAction,
    data: {
      characterId,
    },
  });

  actionMenuStore.clearStack(); // don't just pop because could have used item from inventory
  actionMenuStore.getCurrentMenu().goToFirstPage();
  focusStore.detailables.clear();

  const party = gameStore.getExpectedParty();

  const focusedCharacter = clientApplication.combatantFocus.requireFocusedCharacter();
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
