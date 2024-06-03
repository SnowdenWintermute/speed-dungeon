import { BUTTON_HEIGHT, SPACING_REM } from "@/client_consts";
import React, { useRef, useState } from "react";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import { useGameStore } from "@/stores/game-store";
import { ActionButtonPropertiesByCategory } from "./build-action-button-properties";
import ActionMenuChangeDetectionHandler from "./ActionMenuChangeDetectionHandler";
import createActionMenuButtons from "./action-menu-buttons/create-action-menu-buttons";

const PAGE_SIZE = 6;

export default function ActionMenu() {
  const actionMenuRef = useRef<HTMLUListElement>(null);
  const gameState = useGameStore();
  const [buttonProperties, setButtonProperties] = useState<ActionButtonPropertiesByCategory>({
    top: [],
    numbered: [],
    nextPrev: [],
  });

  const buttonsByCategory = createActionMenuButtons(buttonProperties);

  function handleWheel() {}

  return (
    <section
      className={`max-h-fit max-w-[25rem] flex flex-col justify-between mr-[${SPACING_REM}rem]`}
    >
      {<ActionMenuChangeDetectionHandler setButtonProperties={setButtonProperties} />}
      <ul className={`flex list-none min-w-[25rem] max-w-[25rem] mb-[${SPACING_REM}]`}>
        {
          // top_action_buttons
        }
      </ul>
      <div className={`mb-2 h-[${BUTTON_HEIGHT * PAGE_SIZE}rem]`}>
        <ul
          className="list-none relative pointer-events-auto"
          ref={actionMenuRef}
          onWheel={handleWheel}
        >
          {buttonsByCategory.numbered.map((button, i) => (
            <li key={buttonProperties.numbered[i].text + i}>{button}</li>
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
