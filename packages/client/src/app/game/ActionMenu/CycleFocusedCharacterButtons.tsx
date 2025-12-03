import { NextOrPrevious, getNextOrPreviousNumber } from "@speed-dungeon/common";
import React from "react";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state/menu-state-type";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { observer } from "mobx-react-lite";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";

export const CycleFocusedCharacterButtons = observer(() => {
  const { gameStore, actionMenuStore, hotkeysStore } = AppStore.get();
  const focusedCharacterId = gameStore.getExpectedFocusedCharacterId();
  const party = gameStore.getExpectedParty();

  const characterPositions = party.combatantManager.sortCombatantIdsLeftToRight(
    party.combatantManager.getPartyMemberCombatants().map((combatant) => combatant.getEntityId())
  );

  const currCharIndex = characterPositions.indexOf(focusedCharacterId);

  if (currCharIndex === -1) {
    console.error("Character ID not in position list");
    return null;
  }

  function clickHandler(direction: NextOrPrevious) {
    const nextIndex = getNextOrPreviousNumber(
      currCharIndex,
      characterPositions.length - 1,
      direction,
      { minNumber: 0 }
    );
    const newCharacterId = characterPositions[nextIndex];
    if (newCharacterId === undefined) return console.error("Invalid character position index");

    // this is because if you are looking at an ability that one character owns and you
    // switch to focusing a character that doesn't own it, it doesn't make sense you
    // could still be looking at the allocation menu for that ability
    if (actionMenuStore.viewingAbilityTree()) {
      actionMenuStore.replaceStack([MenuStatePool.get(MenuStateType.ViewingAbilityTree)]);
    }

    gameStore.setFocusedCharacter(newCharacterId);
  }

  return (
    <ul className={`hidden`}>
      <HotkeyButton
        hotkeys={hotkeysStore.getKeybind(HotkeyButtonTypes.CycleBackAlternate)}
        onClick={() => clickHandler(NextOrPrevious.Previous)}
        children={undefined}
      />
      <HotkeyButton
        hotkeys={hotkeysStore.getKeybind(HotkeyButtonTypes.CycleForwardAlternate)}
        onClick={() => clickHandler(NextOrPrevious.Next)}
        children={undefined}
      />
    </ul>
  );
});
