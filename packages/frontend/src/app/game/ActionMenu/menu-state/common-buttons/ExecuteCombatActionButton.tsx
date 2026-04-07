import { observer } from "mobx-react-lite";
import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ClientIntentType } from "@speed-dungeon/common";
import { ClientApplication } from "@/client-application";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";

function clickHandler(clientApplication: ClientApplication) {
  const { actionMenu, combatantFocus, gameClientRef } = clientApplication;
  const characterId = combatantFocus.requireFocusedCharacterId();
  gameClientRef.get().dispatchIntent({
    type: ClientIntentType.UseSelectedCombatAction,
    data: {
      characterId,
    },
  });

  actionMenu.onExecuteAction();
}

export const ExecuteCombatActionButton = observer(() => {
  const clientApplication = useClientApplication();
  const { combatantFocus, uiStore } = clientApplication;

  const userControlsThisCharacter = combatantFocus.clientUserControlsFocusedCombatant();
  const shouldBeDisabled = !userControlsThisCharacter;

  const buttonType = HotkeyButtonTypes.Confirm;

  return (
    <ActionMenuTopButton
      disabled={shouldBeDisabled}
      hotkeys={uiStore.keybinds.getKeybind(buttonType)}
      handleClick={() => clickHandler(clientApplication)}
    >
      Execute ({uiStore.keybinds.getKeybindString(buttonType)})
    </ActionMenuTopButton>
  );
});
