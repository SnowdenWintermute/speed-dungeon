import { BUTTON_HEIGHT, SPACING_REM, SPACING_REM_SMALL } from "@/client_consts";
import React, { useEffect, useRef, useState } from "react";
import { ActionButtonCategory, ActionMenuButtonProperties } from "./action-menu-button-properties";
import { useGameStore } from "@/stores/game-store";
import { ActionButtonPropertiesByCategory } from "./build-action-button-properties";
import ActionMenuChangeDetectionHandler from "./ActionMenuChangeDetectionHandler";
import createActionMenuButtons from "./action-menu-buttons/create-action-menu-buttons";
import WelcomeInfo from "@/app/lobby/WelcomeInfo";
import setActionMenuKeyListeners from "./action-menu-buttons/set-action-menu-key-listeners";

const PAGE_SIZE = 6;

export default function ActionMenu() {
  const actionMenuRef = useRef<HTMLUListElement>(null);
  const keyboardListenerRef = useRef<(e: KeyboardEvent) => void | null>(null);
  const gameState = useGameStore();
  const [buttonProperties, setButtonProperties] = useState<ActionButtonPropertiesByCategory>({
    [ActionButtonCategory.Top]: [],
    [ActionButtonCategory.Numbered]: [],
    [ActionButtonCategory.NextPrevious]: [],
  });

  const buttonsByCategory = createActionMenuButtons(buttonProperties);

  useEffect(() => {
    setActionMenuKeyListeners(buttonProperties, keyboardListenerRef);
    return () => {
      if (keyboardListenerRef.current)
        window.removeEventListener("keyup", keyboardListenerRef.current);
    };
  });

  function handleWheel() {}

  return (
    <section
      className={`max-h-fit max-w-[25rem] flex flex-col justify-between mr-[${SPACING_REM}rem]`}
    >
      {<ActionMenuChangeDetectionHandler setButtonProperties={setButtonProperties} />}
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
      <div className={`mb-2 h-[${BUTTON_HEIGHT * PAGE_SIZE}rem]`}>
        <ul
          className="list-none relative pointer-events-auto"
          ref={actionMenuRef}
          onWheel={handleWheel}
        >
          {buttonsByCategory.numbered.map((button, i) => (
            <li key={buttonProperties[ActionButtonCategory.Top][i].text + i}>{button}</li>
          ))}
          {
            // hovered_action_display
          }
          {
            // selected_action_display
          }
        </ul>
      </div>

      {
        // nextPrevActionButtons.length > 0 ?
        // <ChangeTargetButtons
        //     next_prev_buttons={next_prev_action_buttons.clone()}
        // />
        // :
        // <ActionPageButtons
        // number_of_pages={number_of_pages}
        // hidden={( cloned_action_button_properties.numbered_action_buttons.len() as u32) <= PAGE_SIZE}
        // />
      }
    </section>
  );
}
