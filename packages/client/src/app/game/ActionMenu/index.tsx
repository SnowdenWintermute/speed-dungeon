import { BUTTON_HEIGHT, SPACING_REM } from "@/client_consts";
import React, { useRef } from "react";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import { useGameStore } from "@/stores/game-store";

const PAGE_SIZE = 6;

interface ActionButtonPropertiesByCategory {
  topActionButtons: ActionMenuButtonProperties[];
  numberedActionButtons: ActionMenuButtonProperties[];
  nextPrevActionButtons: ActionMenuButtonProperties[];
}

export default function ActionMenu() {
  const actionMenuRef = useRef<HTMLUListElement>(null);
  const gameState = useGameStore();

  // const (top_action_buttons, numbered_action_buttons, next_prev_action_buttons) =
  //     create_action_menu_buttons(
  //         &action_menu_button_properties.top_action_buttons,
  //         &numbered_button_props_on_current_page.to_vec(),
  //         &action_menu_button_properties.next_prev_action_buttons,
  //     );

  function handleWheel() {}

  return (
    <section
      className={`max-h-fit max-w-[25rem] flex flex-col justify-between mr-[${SPACING_REM}rem]`}
    >
      {
        // <ActionMenuChangeDetectionManager action_menu_button_properties={action_menu_button_properties} />
      }
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
          {
            // numbered_action_buttons
          }
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
