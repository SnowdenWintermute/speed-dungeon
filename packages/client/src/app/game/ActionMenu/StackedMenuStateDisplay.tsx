import { BUTTON_HEIGHT_SMALL, SPACING_REM_SMALL } from "@/client_consts";
import React from "react";
import { ActionMenuState, MENU_STATE_TYPE_STRINGS } from "./menu-state";
import { baseMenuState, useGameStore } from "@/stores/game-store";

export default function StackedMenuStateDisplay() {
  const stackedMenuStates = useGameStore().stackedMenuStates;

  return (
    <div
      className={`relative min-w-[25rem] max-w-[25rem] z-0`}
      style={{ marginBottom: `${SPACING_REM_SMALL}rem`, height: `${BUTTON_HEIGHT_SMALL}rem` }}
    >
      {([baseMenuState] as ActionMenuState[]).concat(stackedMenuStates).map((menuState, i) => {
        console.log("index:", i, stackedMenuStates.length);
        return (
          <MenuStateDisplay
            key={i + MENU_STATE_TYPE_STRINGS[menuState.type]}
            menuState={menuState}
            index={i}
            isTop={!stackedMenuStates.length || i === stackedMenuStates.length}
          />
        );
      })}
    </div>
  );
}

function MenuStateDisplay({
  menuState,
  index,
  isTop,
}: {
  menuState: ActionMenuState;
  index: number;
  isTop: boolean;
}) {
  let offsetPx = index * 2;
  const focusedCharacteResult = useGameStore().getFocusedCharacter();
  if (focusedCharacteResult instanceof Error) return <></>;

  return (
    <div
      className={`
      ${!isTop ? "bg-slate-950" : "bg-slate-800"}
      absolute min-w-[25rem] max-w-[25rem] 
      flex items-center justify-between
      pl-2 pr-2
      outline outline-2 outline-slate-400
      pointer-events-auto animate-slide-appear-from-left-fast`}
      style={{
        marginBottom: `${SPACING_REM_SMALL}rem`,
        height: `${BUTTON_HEIGHT_SMALL}rem`,
        left: `${offsetPx}px`,
        // top: `${offsetPx}px`,
        zIndex: index + 1,
      }}
    >
      <span className={!isTop ? "opacity-0" : ""}>{MENU_STATE_TYPE_STRINGS[menuState.type]}</span>
      <span
        key={focusedCharacteResult.entityProperties.name}
        className="animate-slide-appear-from-left-fast"
      >
        {focusedCharacteResult.entityProperties.name}
      </span>
    </div>
  );
}
