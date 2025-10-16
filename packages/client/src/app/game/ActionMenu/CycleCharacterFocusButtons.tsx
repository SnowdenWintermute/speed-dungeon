import { NextOrPrevious, getNextOrPreviousNumber } from "@speed-dungeon/common";
import React from "react";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { BUTTON_HEIGHT_SMALL, SPACING_REM_SMALL } from "@/client_consts";
import ActionMenuDedicatedButton from "./action-menu-buttons/ActionMenuDedicatedButton";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuButtonProperties } from "./menu-state/action-menu-button-properties";
import { MenuStateType } from "./menu-state/menu-state-type";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { observer } from "mobx-react-lite";

export const CharacterFocusingButtons = observer(() => {
  function createFocusCharacterButtonProperties(
    text: string,
    direction: NextOrPrevious,
    hotkeys: string[]
  ) {
    const button = new ActionMenuButtonProperties(
      () => text,
      text,
      () => {
        const { gameStore } = AppStore.get();
        const focusedCharacterId = gameStore.getExpectedFocusedCharacterId();
        const party = gameStore.getExpectedParty();

        const characterPositions = party.combatantManager.sortCombatantIdsLeftToRight(
          party.combatantManager
            .getPartyMemberCharacters()
            .map((combatant) => combatant.getEntityId())
        );

        const currCharIndex = characterPositions.indexOf(focusedCharacterId);
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
          actionMenuStore.replaceStack([MenuStatePool.get(MenuStateType.ViewingAbilityTree)]);
        }

        gameStore.setFocusedCharacter(newCharacterId);
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

  const focusedCharacterResult = AppStore.get().gameStore.getExpectedFocusedCharacter();

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
        {focusedCharacterResult.entityProperties.name}
      </span>
      <ActionMenuDedicatedButton
        extraStyles="flex-1 flex border-l border-slate-400 h-full"
        properties={nextCharacterButton}
      />
    </ul>
  );
});
