import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";
import { ActionMenuScreenType } from "@/client-application/action-menu/screen-types";
import { observer } from "mobx-react-lite";

export const ViewAbilityTreeButton = observer(() => {
  const clientApplication = useClientApplication();
  const { uiStore, actionMenu, detailableEntityFocus, combatantFocus } = clientApplication;
  const focusedCharacter = combatantFocus.requireFocusedCharacter();
  const unspent = focusedCharacter.combatantProperties.abilityProperties.getUnspentPointsCount();
  const buttonType = HotkeyButtonTypes.ToggleViewingAbilityTree;

  const toggleAbilityTreeHotkeys = uiStore.keybinds.getKeybind(buttonType);
  const toggleViewingAbilityTreeHotkeysString = uiStore.keybinds.getKeybindString(buttonType);
  const highlightClass = unspent ? "text-yellow-400" : "";

  return (
    <ActionMenuTopButton
      extraStyles={highlightClass}
      hotkeys={toggleAbilityTreeHotkeys}
      handleClick={() => {
        detailableEntityFocus.combatantAbilities.clear();
        detailableEntityFocus.detailables.clearHovered();
        actionMenu.clearStack();
        actionMenu.pushFromPool(ActionMenuScreenType.ViewingAbilityTree);
      }}
    >
      Abilities ({toggleViewingAbilityTreeHotkeysString})
    </ActionMenuTopButton>
  );
});
