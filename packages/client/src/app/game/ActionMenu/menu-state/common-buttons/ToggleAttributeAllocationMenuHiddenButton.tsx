import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import { ClientIntentType } from "@speed-dungeon/common";
import React from "react";
import { ActionMenuScreenType } from "../menu-state-type";
import { ActionMenuScreenPool } from "@/mobx-stores/action-menu/menu-state-pool";
import { observer } from "mobx-react-lite";
import { gameClientSingleton } from "@/singletons/lobby-client";

export const ToggleAttributeAllocationMenuHiddenButton = observer(() => {
  const { hotkeysStore } = AppStore.get();

  function clickHandler() {
    const { actionMenuStore, gameStore } = AppStore.get();
    const entityId = gameStore.getExpectedFocusedCharacterId();

    if (gameStore.clientUserControlsFocusedCombatant()) {
      gameClientSingleton.get().dispatchIntent({
        type: ClientIntentType.SelectCombatAction,
        data: {
          characterId: entityId,
          actionAndRankOption: null,
        },
      });
    }

    if (actionMenuStore.currentMenuIsType(ActionMenuScreenType.AssignAttributePoints)) {
      actionMenuStore.popStack();
    } else {
      gameStore.setFocusedCharacter(entityId);
      actionMenuStore.replaceStack([ActionMenuScreenPool.get(ActionMenuScreenType.AssignAttributePoints)]);
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
