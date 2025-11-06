import React from "react";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { MenuStateType } from "../menu-state-type";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";

export const setViewingAbilityTreeHotkey = HOTKEYS.BOTTOM_ALT;

export default function ViewAbilityTreeButton() {
  const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
  const unspent = focusedCharacter.combatantProperties.abilityProperties.getUnspentPointsCount();
  const highlightClass = unspent ? "text-yellow-400" : "";

  return (
    <ActionMenuTopButton
      extraStyles={highlightClass}
      handleClick={() => {
        const { actionMenuStore } = AppStore.get();
        actionMenuStore.clearHoveredAction();
        actionMenuStore.replaceStack([MenuStatePool.get(MenuStateType.ViewingAbilityTree)]);
      }}
    >
      Abilities ({letterFromKeyCode(setViewingAbilityTreeHotkey)})
    </ActionMenuTopButton>
  );
}
