import { BUTTON_HEIGHT, SPACING_REM, SPACING_REM_SMALL } from "@/client_consts";
import React, { useEffect, useRef, useState } from "react";
import { ActionButtonCategory, ActionMenuButtonProperties } from "./action-menu-button-properties";
import { useGameStore } from "@/stores/game-store";
import { ActionButtonPropertiesByCategory } from "./build-action-button-properties";
import ActionMenuChangeDetectionHandler from "./ActionMenuChangeDetectionHandler";
import createActionMenuButtons from "./action-menu-buttons/create-action-menu-buttons";
import setActionMenuKeyListeners from "./action-menu-buttons/set-action-menu-key-listeners";
import cloneDeep from "lodash.clonedeep";
import PageTurningButtons from "./action-menu-buttons/PageTurningButtons";
import calculateNumberOfPages from "./action-menu-buttons/calculate-number-of-pages";
import ChangeTargetButtons from "./action-menu-buttons/ChangeTargetButtons";
import ActionDetails from "../detailables/ActionDetails";

export const ACTION_MENU_PAGE_SIZE = 6;

export default function ActionMenu() {
  const actionMenuRef = useRef<HTMLUListElement>(null);
  const keyupListenerRef = useRef<(e: KeyboardEvent) => void | null>(null);
  const keyPressListenerRef = useRef<(e: KeyboardEvent) => void | null>(null);
  const gameState = useGameStore();

  const [buttonProperties, setButtonProperties] = useState<ActionButtonPropertiesByCategory>({
    [ActionButtonCategory.Top]: [],
    [ActionButtonCategory.Numbered]: [],
    [ActionButtonCategory.NextPrevious]: [],
  });
  const [numberedButtonPropertiesOnCurrentPage, setNumberedButtonPropertiesOnCurrentPage] =
    useState<ActionMenuButtonProperties[]>([]);
  const [lastPageNumberFiltered, setLastPageNumberFiltered] = useState(0);

  const buttonsByCategory = createActionMenuButtons(
    buttonProperties,
    numberedButtonPropertiesOnCurrentPage
  );
  const currentPageNumber = gameState.actionMenuCurrentPageNumber;
  const numberOfPages = calculateNumberOfPages(
    ACTION_MENU_PAGE_SIZE,
    Object.values(buttonProperties[ActionButtonCategory.Numbered]).length
  );

  // KEYBOARD LISTENERS
  useEffect(() => {
    // @TODO - add dependency for onCurrentPage properties
  }, [buttonProperties, currentPageNumber]);

  // DETERMINE CURRENT PAGE NUMBERED BUTTONS
  useEffect(() => {
    console.log("filtering and setting key listeners");
    const minIndex = currentPageNumber * ACTION_MENU_PAGE_SIZE;
    const maxIndex = currentPageNumber * ACTION_MENU_PAGE_SIZE + ACTION_MENU_PAGE_SIZE - 1;
    const filteredActions = Object.values(buttonProperties[ActionButtonCategory.Numbered]).filter(
      (_buttonProperties, i) => i >= minIndex && i <= maxIndex
    );
    setNumberedButtonPropertiesOnCurrentPage(filteredActions);
    // this is for going back one page if for some reason the current page has no actions on it now
    if (
      currentPageNumber !== 0 &&
      filteredActions.length === 0 &&
      buttonProperties[ActionButtonCategory.Numbered].length !== 0 &&
      currentPageNumber === lastPageNumberFiltered
    ) {
      gameState.mutateState((gameState) => {
        gameState.actionMenuCurrentPageNumber -= 1;
      });
    }
    setLastPageNumberFiltered(currentPageNumber);

    // KEY LISTENERS
    const buttonPropertiesWithFilteredNumberedButtons = cloneDeep(buttonProperties);
    buttonPropertiesWithFilteredNumberedButtons[ActionButtonCategory.Numbered] =
      numberedButtonPropertiesOnCurrentPage;
    setActionMenuKeyListeners(
      buttonProperties,
      numberedButtonPropertiesOnCurrentPage,
      keyupListenerRef,
      keyPressListenerRef
    );
    return () => {
      if (keyupListenerRef.current) window.removeEventListener("keyup", keyupListenerRef.current);
      if (keyPressListenerRef.current)
        window.removeEventListener("keypress", keyPressListenerRef.current);
    };
  }, [buttonProperties, currentPageNumber]);

  function handleWheel() {}

  let hoveredActionDisplay = <></>;
  if (gameState.hoveredAction) {
    hoveredActionDisplay = (
      <div className="absolute top-0 left-full pl-2">
        <div className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2">
          <ActionDetails combatAction={gameState.hoveredAction} hideTitle={false} />
        </div>
      </div>
    );
  }

  let selectedActionDisplay = <></>;
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  if (!(focusedCharacterResult instanceof Error)) {
    const selectedCombatActionOption =
      focusedCharacterResult.combatantProperties.selectedCombatAction;
    if (selectedCombatActionOption) {
      selectedActionDisplay = (
        <div
          className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2"
          style={{ height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem` }}
        >
          <ActionDetails combatAction={selectedCombatActionOption} hideTitle={false} />
        </div>
      );
    }
  }

  return (
    <section
      className={`max-h-fit max-w-[25rem] flex flex-col justify-between`}
      style={{ marginRight: `${SPACING_REM}rem` }}
    >
      <ActionMenuChangeDetectionHandler setButtonProperties={setButtonProperties} />
      <ul
        className={`flex list-none min-w-[25rem] max-w-[25rem]`}
        style={{ marginBottom: `${SPACING_REM_SMALL}rem` }}
      >
        {buttonsByCategory.top.map((button, i) => (
          <li
            key={buttonProperties[ActionButtonCategory.Top][i].text + i}
            style={{ marginRight: `${SPACING_REM}rem` }}
          >
            {button}
          </li>
        ))}
      </ul>
      <div className={`mb-2`} style={{ height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem` }}>
        <ul
          className="list-none relative pointer-events-auto"
          ref={actionMenuRef}
          onWheel={handleWheel}
        >
          {buttonsByCategory.numbered.map((button, i) => (
            <li key={numberedButtonPropertiesOnCurrentPage[i].text + i}>{button}</li>
          ))}
          {hoveredActionDisplay}
          {selectedActionDisplay}
        </ul>
      </div>

      {Object.values(buttonsByCategory.nextPrev).length > 0 ? (
        <ChangeTargetButtons>{buttonsByCategory.nextPrev}</ChangeTargetButtons>
      ) : (
        <PageTurningButtons
          numberOfPages={numberOfPages}
          hidden={
            Object.values(buttonProperties[ActionButtonCategory.Numbered]).length <=
            ACTION_MENU_PAGE_SIZE
          }
        />
      )}
    </section>
  );
}
