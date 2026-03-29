import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ClientIntentType } from "@speed-dungeon/common";
import React from "react";
import { observer } from "mobx-react-lite";
import { ActionMenuScreenType } from "@/client-application/action-menu/screen-types";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";

export const ToggleAttributeAllocationMenuHiddenButton = observer(() => {
  const clientApplication = useClientApplication();
  const { uiStore, actionMenu, combatantFocus, gameClientRef } = clientApplication;
  const { keybinds } = uiStore;

  function clickHandler() {
    const entityId = combatantFocus.requireFocusedCharacterId();

    if (combatantFocus.clientUserControlsFocusedCombatant()) {
      gameClientRef.get().dispatchIntent({
        type: ClientIntentType.SelectCombatAction,
        data: {
          characterId: entityId,
          actionAndRankOption: null,
        },
      });
    }

    if (actionMenu.currentMenuIsType(ActionMenuScreenType.AssignAttributePoints)) {
      actionMenu.popStack();
    } else {
      combatantFocus.setFocusedCharacter(entityId);
      actionMenu.clearStack();
      actionMenu.pushFromPool(ActionMenuScreenType.AssignAttributePoints);
    }
  }

  const buttonType = HotkeyButtonTypes.ToggleAssignAttributesMenu;

  return (
    <HotkeyButton
      onClick={clickHandler}
      hotkeys={keybinds.getKeybind(buttonType)}
      className="hidden"
      children=""
    />
  );
});
