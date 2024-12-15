import {
  BUTTON_HEIGHT,
  BUTTON_HEIGHT_SMALL,
  SPACING_REM,
  SPACING_REM_SMALL,
} from "@/client_consts";
import React, { ReactNode, useEffect } from "react";
import { getCurrentMenu, useGameStore } from "@/stores/game-store";
import { ActionButtonCategory, ActionMenuButtonProperties, MenuStateType } from "./menu-state";
import ActionDetails from "../detailables/ActionDetails";
import {
  ConsideringCombatActionMenuState,
  EXECUTE_BUTTON_TEXT,
} from "./menu-state/considering-combat-action";
import ActionMenuDedicatedButton from "./action-menu-buttons/ActionMenuDedicatedButton";
import NumberedButton from "./action-menu-buttons/NumberedButton";
import setFocusedCharacter from "@/utils/set-focused-character";
import getCurrentParty from "@/utils/getCurrentParty";
import { Consumable, Item, NextOrPrevious, getNextOrPreviousNumber } from "@speed-dungeon/common";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { VIEW_LOOT_BUTTON_TEXT } from "./menu-state/base";
import {
  ConsideringItemMenuState,
  EQUIP_ITEM_BUTTON_TEXT,
  USE_CONSUMABLE_BUTTON_TEXT,
} from "./menu-state/considering-item";
import ItemDetailsWithComparison from "../ItemDetailsWithComparison";
import shouldShowCharacterSheet from "@/utils/should-show-character-sheet";
import Divider from "@/app/components/atoms/Divider";

export const ACTION_MENU_PAGE_SIZE = 6;
const topButtonLiStyle = { marginRight: `${SPACING_REM}rem` };

export default function ActionMenu({ inputLocked }: { inputLocked: boolean }) {
  const combatantModelsAwaitingSpawn = useGameStore((state) => state.combatantModelsAwaitingSpawn);
  const hoveredAction = useGameStore((state) => state.hoveredAction);
  const hoveredItem = useGameStore((state) =>
    state.hoveredEntity instanceof Item ? state.hoveredEntity : null
  );
  const currentMenu = useGameStore.getState().getCurrentMenu();
  const buttonProperties = currentMenu.getButtonProperties();
  const numberOfNumberedButtons = buttonProperties[ActionButtonCategory.Numbered].length;
  const mutateGameState = useGameStore().mutateState;
  const viewingCharacterSheet = shouldShowCharacterSheet(currentMenu.type);

  useEffect(() => {
    if (currentMenu.type === MenuStateType.ItemsOnGround && numberOfNumberedButtons === 0) {
      mutateGameState((state) => {
        state.stackedMenuStates.pop();
      });
    }
  }, [currentMenu.type, numberOfNumberedButtons]);

  // instead of directly getting the button properties, we must put it in a useEffect
  // because some of the button creation calls zustand mutation/set state functions
  // which causes a warning which was hard to track down about updating other components
  // while this component was rendering, in short, you aren't allowed to update state in
  // a component render, which is what happens if you try to call currentMenu.getButtonProperties()
  // directly in the component
  useEffect(() => {
    const numPages = Math.max(
      1,
      Math.ceil(buttonProperties[ActionButtonCategory.Numbered].length / ACTION_MENU_PAGE_SIZE)
    );
    useGameStore.getState().mutateState((state) => {
      getCurrentMenu(state).numPages = numPages;
    });
  }, [buttonProperties[ActionButtonCategory.Numbered].length]);

  if (inputLocked) return <div />;
  if (combatantModelsAwaitingSpawn.length)
    <div>Awating spawn of {combatantModelsAwaitingSpawn.length} models...</div>;

  let selectedActionDisplay = <></>;
  if (currentMenu instanceof ConsideringCombatActionMenuState) {
    selectedActionDisplay = (
      <div
        className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2 flex"
        style={{ height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem` }}
      >
        <ActionDetails combatAction={currentMenu.combatAction} hideTitle={false} />
      </div>
    );
  }

  let detailedItemDisplay = <></>;
  if (currentMenu instanceof ConsideringItemMenuState) {
    detailedItemDisplay = (
      <div
        className="min-w-[25rem] max-w-[25rem]"
        style={{ height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem` }}
      >
        <div className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2 flex flex-col items-center pointer-events-auto">
          <div className="">{currentMenu.item.entityProperties.name}</div>
          <Divider extraStyles="w-full" />
          {currentMenu.item instanceof Consumable ? (
            <div>Select "use" to choose a target for this consumable</div>
          ) : (
            <div>Equipping this item will swap it with any currently equipped item</div>
          )}
        </div>
      </div>
    );
  }

  let hoveredActionDisplay: ReactNode | null = null;
  if (hoveredAction) {
    hoveredActionDisplay = (
      <div className="pl-2">
        <div className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2">
          <ActionDetails combatAction={hoveredAction} hideTitle={false} />
        </div>
      </div>
    );
  }

  let hoveredItemDisplay: ReactNode | null = null;
  if (!viewingCharacterSheet && hoveredItem) {
    hoveredItemDisplay = (
      <div className="pl-2">
        <div className="min-w-[50rem] max-w-[50rem]">
          <ItemDetailsWithComparison />
        </div>
      </div>
    );
  }

  return (
    <section className={`max-h-fit flex flex-col justify-between`}>
      <CharacterFocusingButtons />
      <ul
        className={`flex list-none min-w-[25rem] max-w-[25rem]`}
        style={{ marginBottom: `${SPACING_REM_SMALL}rem` }}
      >
        {buttonProperties[ActionButtonCategory.Top].map((button, i) => {
          const conditionalStyles = (() => {
            if (
              button.text === VIEW_LOOT_BUTTON_TEXT ||
              button.text === EXECUTE_BUTTON_TEXT ||
              button.text === USE_CONSUMABLE_BUTTON_TEXT ||
              button.text === EQUIP_ITEM_BUTTON_TEXT
            )
              return "bg-slate-800 border-white";
            return "border-slate-400 bg-slate-700";
          })();
          const thisButtonProperties = buttonProperties[ActionButtonCategory.Top][i]!;
          // in the old method we used a more unique key so different cancel buttons would
          // actually update, but cancel buttons tend to do the same thing anyway now
          return (
            <li key={thisButtonProperties.text} style={topButtonLiStyle}>
              <ActionMenuDedicatedButton
                extraStyles={`border mr-2 last:mr-0 h-10 ${conditionalStyles}`}
                properties={button}
              />
            </li>
          );
        })}
      </ul>
      <div
        className={`mb-2 flex`}
        style={{
          height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem`,
        }}
      >
        <ul className="list-none relative min-w-[25rem] max-w-[25rem]">
          {buttonProperties[ActionButtonCategory.Numbered]
            .slice(
              (currentMenu.page - 1) * ACTION_MENU_PAGE_SIZE,
              (currentMenu.page - 1) * ACTION_MENU_PAGE_SIZE + ACTION_MENU_PAGE_SIZE
            )
            .map((button, i) => {
              const conditionalStyles =
                currentMenu.type === MenuStateType.ItemsOnGround
                  ? "bg-slate-800 border-white"
                  : "border-slate-400 bg-slate-700";

              return (
                <li
                  key={button.text + i + currentMenu.page}
                  tabIndex={button.shouldBeDisabled ? 0 : undefined} // so you can tab over to get the popups
                  className={`
                   ${conditionalStyles} pointer-events-auto w-full border-b border-r border-l first:border-t flex hover:bg-slate-950
                   `}
                  onMouseEnter={button.mouseEnterHandler}
                  onMouseLeave={button.mouseLeaveHandler}
                  onFocus={button.focusHandler}
                  onBlur={button.blurHandler}
                >
                  <NumberedButton number={i + 1} properties={button} />
                </li>
              );
            })}
          {selectedActionDisplay}
          {detailedItemDisplay}
        </ul>
        {hoveredActionDisplay}
        {hoveredItemDisplay}
      </div>
      <BottomButtons
        numPages={currentMenu.numPages}
        currentPageNumber={currentMenu.page}
        left={buttonProperties[ActionButtonCategory.Bottom][0]}
        right={buttonProperties[ActionButtonCategory.Bottom][1]}
      />
    </section>
  );
}

function BottomButtons({
  numPages,
  currentPageNumber,
  left,
  right,
}: {
  numPages: number;
  currentPageNumber: number;
  left?: ActionMenuButtonProperties;
  right?: ActionMenuButtonProperties;
}) {
  return (
    <div
      className="flex justify-between bg-slate-700 relative border border-slate-400 h-8"
      style={!left && !right ? { opacity: 0 } : {}}
    >
      <div key={left?.text} className="flex-1 border-r border-slate-400 h-full">
        {left && <ActionMenuDedicatedButton extraStyles="w-full h-full" properties={left} />}
      </div>
      <div
        className="h-full flex items-center justify-center pr-2 pl-2"
        style={numPages <= 1 ? { display: "none" } : {}}
      >
        <span>
          Page {currentPageNumber}/{numPages}
        </span>
      </div>
      <div key={right?.text} className="flex-1 flex border-l border-slate-400 h-full">
        {right && <ActionMenuDedicatedButton extraStyles="w-full justify-end" properties={right} />}
      </div>
    </div>
  );
}

function CharacterFocusingButtons() {
  function createFocusCharacterButtonProperties(
    text: string,
    direction: NextOrPrevious,
    hotkeys: string[]
  ) {
    const button = new ActionMenuButtonProperties(text, () => {
      const currentFocusedCharacterId = useGameStore.getState().focusedCharacterId;
      const party = getCurrentParty(
        useGameStore.getState(),
        useGameStore.getState().username || ""
      );
      if (!party) return;
      const currCharIndex = party.characterPositions.indexOf(currentFocusedCharacterId);
      if (currCharIndex === -1) return console.error("Character ID not in position list");
      const nextIndex = getNextOrPreviousNumber(
        currCharIndex,
        party.characterPositions.length - 1,
        direction,
        { minNumber: 0 }
      );
      const newCharacterId = party.characterPositions[nextIndex];
      if (newCharacterId === undefined) return console.error("Invalid character position index");
      setFocusedCharacter(newCharacterId);
    });

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
      className={`flex list-none min-w-[25rem] max-w-[25rem] justify-between bg-slate-700 border border-slate-400 pointer-events-auto`}
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
