import { BUTTON_HEIGHT, SPACING_REM, SPACING_REM_SMALL } from "@/client_consts";
import React, { useRef } from "react";
import { useGameStore } from "@/stores/game-store";
import { ActionButtonCategory, ActionMenuButtonProperties } from "./menu-state";
import ActionDetails from "../detailables/ActionDetails";
import { ConsideringCombatActionMenuState } from "./menu-state/considering-combat-action";
import ActionMenuDedicatedButton from "./action-menu-buttons/ActionMenuDedicatedButton";
import NumberedButton from "./action-menu-buttons/NumberedButton";

export const ACTION_MENU_PAGE_SIZE = 6;
const topButtoLiStyle = { marginRight: `${SPACING_REM}rem` };

export default function ActionMenu({ inputLocked }: { inputLocked: boolean }) {
  const actionMenuRef = useRef<HTMLUListElement>(null);
  const combatantModelsAwaitingSpawn = useGameStore((state) => state.combatantModelsAwaitingSpawn);
  const hoveredAction = useGameStore((state) => state.hoveredAction);
  const currentMenu = useGameStore.getState().getCurrentMenu();
  const buttonProperties = currentMenu.getButtonProperties();

  if (inputLocked) return <div />;
  if (combatantModelsAwaitingSpawn.length)
    <div>Awating spawn of {combatantModelsAwaitingSpawn.length} models...</div>;

  let selectedActionDisplay = <></>;
  if (currentMenu instanceof ConsideringCombatActionMenuState) {
    selectedActionDisplay = (
      <div
        className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2"
        style={{ height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem` }}
      >
        <ActionDetails combatAction={currentMenu.combatAction} hideTitle={false} />
      </div>
    );
  }

  let hoveredActionDisplay = <></>;
  if (hoveredAction) {
    hoveredActionDisplay = (
      <div className="absolute top-0 left-full pl-2">
        <div className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2">
          <ActionDetails combatAction={hoveredAction} hideTitle={false} />
        </div>
      </div>
    );
  }

  return (
    <section
      className={`max-h-fit max-w-[25rem] flex flex-col justify-between`}
      style={{ marginRight: `${SPACING_REM}rem` }}
    >
      <ul
        className={`flex list-none min-w-[25rem] max-w-[25rem]`}
        style={{ marginBottom: `${SPACING_REM_SMALL}rem` }}
      >
        {buttonProperties[ActionButtonCategory.Top].map((button, i) => {
          const thisButtonProperties = buttonProperties[ActionButtonCategory.Top][i]!;
          // in the old method we used a more unique key so different cancel buttons would
          // actually update, but cancel buttons tend to do the same thing anyway now
          return (
            <li key={thisButtonProperties.text} style={topButtoLiStyle}>
              <ActionMenuDedicatedButton
                extraStyles="border border-slate-400 mr-2 last:mr-0"
                properties={button}
              ></ActionMenuDedicatedButton>
            </li>
          );
        })}
      </ul>
      <div
        className={`mb-2`}
        style={{
          height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem`,
        }}
      >
        <ul className="list-none relative pointer-events-auto" ref={actionMenuRef}>
          {buttonProperties[ActionButtonCategory.Numbered].map((button, i) => (
            <li key={button.text + i}>
              <NumberedButton number={i + 1} properties={button} />
            </li>
          ))}
          {selectedActionDisplay}
          {hoveredActionDisplay}
        </ul>
      </div>
      <BottomButtons
        left={buttonProperties[ActionButtonCategory.Bottom][0]}
        right={buttonProperties[ActionButtonCategory.Bottom][1]}
      />
    </section>
  );
}

function BottomButtons({
  left,
  right,
}: {
  left?: ActionMenuButtonProperties;
  right?: ActionMenuButtonProperties;
}) {
  const currentMenu = useGameStore.getState().getCurrentMenu();
  return (
    <div
      className="flex justify-between bg-slate-700 relative border border-slate-400 h-8"
      style={!left && !right ? { opacity: 0 } : {}}
    >
      <div key={left?.text} className="w-1/3 border-r border-slate-400 h-full">
        {left && <ActionMenuDedicatedButton extraStyles="w-full" properties={left} />}
      </div>
      <div
        className="h-full flex items-center justify-center"
        style={currentMenu.numPages <= 1 ? { opacity: 0 } : {}}
      >
        <span>
          Page {currentMenu.page}/{currentMenu.numPages}
        </span>
      </div>
      <div key={right?.text} className="w-1/3 flex border-l border-slate-400 h-full">
        {right && <ActionMenuDedicatedButton extraStyles="w-full justify-end" properties={right} />}
      </div>
    </div>
  );
}
