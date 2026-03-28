import { NextOrPrevious, getNextOrPreviousNumber } from "@speed-dungeon/common";
import React from "react";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { ActionMenuScreenType } from "@/client-application/action-menu/screen-types";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";

export const CycleFocusedCharacterButtons = observer(() => {
  const clientApplication = useClientApplication();
  const { gameContext, uiStore, actionMenu, combatantFocus } = clientApplication;
  const { keybinds } = uiStore;
  const party = gameContext.requireParty();
  const focusedCharacterId = combatantFocus.requireFocusedCharacterId();

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
    if (actionMenu.viewingAbilityTree()) {
      actionMenu.replaceStack([]);
      actionMenu.pushFromPool(ActionMenuScreenType.ViewingAbilityTree);
    }

    combatantFocus.setFocusedCharacter(newCharacterId);
  }

  return (
    <ul className={`hidden`}>
      <HotkeyButton
        hotkeys={keybinds.getKeybind(HotkeyButtonTypes.CycleBackAlternate)}
        onClick={() => clickHandler(NextOrPrevious.Previous)}
        children={undefined}
      />
      <HotkeyButton
        hotkeys={keybinds.getKeybind(HotkeyButtonTypes.CycleForwardAlternate)}
        onClick={() => clickHandler(NextOrPrevious.Next)}
        children={undefined}
      />
    </ul>
  );
});
