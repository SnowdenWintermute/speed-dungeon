import { BUTTON_HEIGHT_SMALL, SPACING_REM_SMALL } from "@/client-consts";
import React from "react";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";

export const StackedActionMenuScreenDisplay = observer(() => {
  const clientApplication = useClientApplication();
  const { actionMenu } = clientApplication;
  const stackedActionMenuScreenStringNames = actionMenu.getStackedMenuStringNames();

  return (
    <div
      className={`relative min-w-[25rem] max-w-[25rem] z-0`}
      style={{ marginBottom: `${SPACING_REM_SMALL}rem`, height: `${BUTTON_HEIGHT_SMALL}rem` }}
    >
      {stackedActionMenuScreenStringNames.map((stringName, i) => {
        return (
          <ActionMenuScreenDisplay
            key={i + stringName}
            menuStringName={stringName}
            index={i}
            isTop={stackedActionMenuScreenStringNames.length === i + 1}
            stackSize={stackedActionMenuScreenStringNames.length}
          />
        );
      })}
    </div>
  );
});

const ActionMenuScreenDisplay = observer(
  ({
    menuStringName,
    index,
    isTop,
    stackSize,
  }: {
    menuStringName: string;
    index: number;
    isTop: boolean;
    stackSize: number;
  }) => {
    const clientApplication = useClientApplication();
    const { combatantFocus } = clientApplication;
    const offsetPx = index * 3;
    const focusedCharacter = combatantFocus.requireFocusedCharacter();

    const filterStrengthNormalized = 1 - 0.2 * (stackSize - index);

    return (
      <div
        className={`
      ${!isTop ? "bg-slate-950" : "bg-slate-800 outline-slate-400"}
      absolute min-w-[25rem] max-w-[25rem] 
      flex items-center justify-between
      pl-2 pr-2
      outline outline-2 
      pointer-events-auto animate-slide-appear-from-left-fast`}
        style={{
          marginBottom: `${SPACING_REM_SMALL}rem`,
          height: `${BUTTON_HEIGHT_SMALL}rem`,
          left: `${offsetPx}px`,
          // top: `${offsetPx}px`,
          zIndex: index + 1,
          filter: isTop ? undefined : `brightness(${filterStrengthNormalized})`,
        }}
      >
        <span className={!isTop ? "opacity-0" : ""}>{menuStringName}</span>
        <span
          key={focusedCharacter.entityProperties.name}
          className="animate-slide-appear-from-left-fast"
        >
          {focusedCharacter.entityProperties.name}
        </span>
      </div>
    );
  }
);
