import { BUTTON_HEIGHT, SPACING_REM, SPACING_REM_SMALL } from "@/client_consts";
import React, { useRef, useState } from "react";
import { ActionButtonCategory, ActionMenuButtonProperties } from "./action-menu-button-properties";
import { useGameStore } from "@/stores/game-store";
import ActionMenuChangeDetectionHandler from "./ActionMenuChangeDetectionHandler";
import createActionMenuButtons from "./action-menu-buttons/create-action-menu-buttons";
import PageTurningButtons from "./action-menu-buttons/PageTurningButtons";
import ChangeTargetButtons from "./action-menu-buttons/ChangeTargetButtons";
import ActionDetails from "../detailables/ActionDetails";

export const ACTION_MENU_PAGE_SIZE = 6;

export default function ActionMenu() {
  const actionMenuRef = useRef<HTMLUListElement>(null);
  const gameState = useGameStore();

  const [buttonProperties, setButtonProperties] = useState<
    Record<ActionButtonCategory, ActionMenuButtonProperties[]>
  >({
    [ActionButtonCategory.Top]: [],
    [ActionButtonCategory.Numbered]: [],
    [ActionButtonCategory.NextPrevious]: [],
  });
  const [numberOfPages, setNumberOfPages] = useState(1);

  const buttonsByCategory = createActionMenuButtons(buttonProperties);

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
      <ActionMenuChangeDetectionHandler
        setButtonProperties={setButtonProperties}
        setNumberOfPages={setNumberOfPages}
      />
      <ul
        className={`flex list-none min-w-[25rem] max-w-[25rem]`}
        style={{ marginBottom: `${SPACING_REM_SMALL}rem` }}
      >
        {buttonsByCategory.top.map((button, i) => {
          const thisButtonProperties = buttonProperties[ActionButtonCategory.Top][i];
          return (
            <li
              key={JSON.stringify(thisButtonProperties.action) + thisButtonProperties.text + i}
              style={{ marginRight: `${SPACING_REM}rem` }}
            >
              {button}
            </li>
          );
        })}
      </ul>
      <div className={`mb-2`} style={{ height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem` }}>
        <ul
          className="list-none relative pointer-events-auto"
          ref={actionMenuRef}
          onWheel={handleWheel}
        >
          {buttonsByCategory.numbered.map((button, i) => (
            <li key={buttonProperties[ActionButtonCategory.Numbered][i].text + i}>{button}</li>
          ))}
          {hoveredActionDisplay}
          {selectedActionDisplay}
        </ul>
      </div>

      {Object.values(buttonsByCategory.nextPrev).length > 0 ? (
        <ChangeTargetButtons>{buttonsByCategory.nextPrev}</ChangeTargetButtons>
      ) : (
        <PageTurningButtons numberOfPages={numberOfPages} hidden={numberOfPages < 2} />
      )}
    </section>
  );
}
