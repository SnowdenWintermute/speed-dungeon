import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuScreenPool } from "@/mobx-stores/action-menu/menu-state-pool";
import { ActionMenuScreenType } from "../menu-state-type";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";

const buttonType = HotkeyButtonTypes.ToggleViewingAbilityTree;
const { hotkeysStore } = AppStore.get();

export const toggleAbilityTreeHotkeys = hotkeysStore.getKeybind(buttonType);
export const toggleViewingAbilityTreeHotkeysString = hotkeysStore.getKeybindString(buttonType);

export default function ViewAbilityTreeButton() {
  const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
  const unspent = focusedCharacter.combatantProperties.abilityProperties.getUnspentPointsCount();
  const highlightClass = unspent ? "text-yellow-400" : "";

  return (
    <ActionMenuTopButton
      extraStyles={highlightClass}
      hotkeys={toggleAbilityTreeHotkeys}
      handleClick={() => {
        const { actionMenuStore, focusStore } = AppStore.get();
        focusStore.combatantAbilities.clear();
        focusStore.detailables.clearHovered();
        actionMenuStore.replaceStack([ActionMenuScreenPool.get(ActionMenuScreenType.ViewingAbilityTree)]);
      }}
    >
      Abilities ({toggleViewingAbilityTreeHotkeysString})
    </ActionMenuTopButton>
  );
}
