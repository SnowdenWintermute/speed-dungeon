import { useGameStore } from "@/stores/game-store";
import { NextOrPrevious, getNextOrPreviousNumber } from "@speed-dungeon/common";
import React from "react";
import { ActionMenuButtonProperties, MenuStateType } from "./menu-state";
import getCurrentParty from "@/utils/getCurrentParty";
import setFocusedCharacter from "@/utils/set-focused-character";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { getFocusedCharacter } from "@/utils/getFocusedCharacter";
import { BUTTON_HEIGHT_SMALL, SPACING_REM_SMALL } from "@/client_consts";
import ActionMenuDedicatedButton from "./action-menu-buttons/ActionMenuDedicatedButton";
import { AppStore } from "@/mobx-stores/app-store";
import { MENU_STATE_POOL } from "@/mobx-stores/action-menu/menu-state-pool";

export function CharacterFocusingButtons() {
  function createFocusCharacterButtonProperties(
    text: string,
    direction: NextOrPrevious,
    hotkeys: string[]
  ) {
    const button = new ActionMenuButtonProperties(
      () => text,
      text,
      () => {
        const currentFocusedCharacterId = useGameStore.getState().focusedCharacterId;
        const party = getCurrentParty(
          useGameStore.getState(),
          useGameStore.getState().username || ""
        );
        if (!party) return;

        const characterPositions = party.combatantManager.sortCombatantIdsLeftToRight(
          party.combatantManager
            .getPartyMemberCharacters()
            .map((combatant) => combatant.getEntityId())
        );

        const currCharIndex = characterPositions.indexOf(currentFocusedCharacterId);
        if (currCharIndex === -1) return console.error("Character ID not in position list");
        const nextIndex = getNextOrPreviousNumber(
          currCharIndex,
          characterPositions.length - 1,
          direction,
          { minNumber: 0 }
        );
        const newCharacterId = characterPositions[nextIndex];
        if (newCharacterId === undefined) return console.error("Invalid character position index");

        const { actionMenuStore } = AppStore.get();
        if (actionMenuStore.viewingAbilityTree()) {
          actionMenuStore.replaceStack([MENU_STATE_POOL[MenuStateType.ViewingAbilityTree]]);
        }

        setFocusedCharacter(newCharacterId);
      }
    );

    button.dedicatedKeys = hotkeys;
    return button;
  }

  const previousCharacterHotkey = HOTKEYS.LEFT_ALT;
  const previousCharacterButton = createFocusCharacterButtonProperties(
    `Previous (${letterFromKeyCode(previousCharacterHotkey)})`,
    NextOrPrevious.Previous,
    [previousCharacterHotkey]
  );
  const nextCharacterHotkey = HOTKEYS.RIGHT_ALT;
  const nextCharacterButton = createFocusCharacterButtonProperties(
    `Next (${letterFromKeyCode(nextCharacterHotkey)})`,
    NextOrPrevious.Next,
    [nextCharacterHotkey]
  );

  const focusedCharacter = getFocusedCharacter();
  if (focusedCharacter instanceof Error) return <div>Error: no focused character</div>;

  return (
    <ul
      className={`hidden list-none min-w-[25rem] max-w-[25rem] justify-between bg-slate-700 border border-slate-400 pointer-events-auto`}
      style={{ marginBottom: `${SPACING_REM_SMALL}rem`, height: `${BUTTON_HEIGHT_SMALL}rem` }}
    >
      <ActionMenuDedicatedButton
        extraStyles="flex-1 flex border-r border-slate-400 h-full"
        properties={previousCharacterButton}
      />
      <span className="h-full flex items-center justify-center pr-2 pl-2 overflow-hidden w-1/3 text-nowrap overflow-ellipsis">
        {focusedCharacter.entityProperties.name}
      </span>
      <ActionMenuDedicatedButton
        extraStyles="flex-1 flex border-l border-slate-400 h-full"
        properties={nextCharacterButton}
      />
    </ul>
  );
}
