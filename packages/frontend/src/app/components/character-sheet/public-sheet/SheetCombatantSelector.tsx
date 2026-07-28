import { BUTTON_HEIGHT_SMALL, SPACING_REM_SMALL } from "@/client-consts";
import { Combatant } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";

// the public counterpart of the in-game CharacterSheetTopBar: which combatant the sheet is about.
// a character with no pets is the only thing to look at, so the row would say nothing
export const SheetCombatantSelector = observer(
  ({
    combatants,
    selectedIndex,
    onSelect,
  }: {
    combatants: Combatant[];
    selectedIndex: number;
    onSelect: (index: number) => void;
  }) => {
    if (combatants.length < 2) {
      return null;
    }

    return (
      <ul className="flex list-none" style={{ marginBottom: `${SPACING_REM_SMALL}rem` }}>
        {combatants.map((combatant, index) => (
          <li key={combatant.getEntityId()}>
            <button
              className={`border border-slate-400 bg-slate-700 w-28 px-2 mr-2.5 text-ellipsis overflow-hidden ${
                index === selectedIndex ? "border-yellow-400" : ""
              }`}
              style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}
              onClick={() => onSelect(index)}
            >
              {combatant.entityProperties.name}
            </button>
          </li>
        ))}
      </ul>
    );
  }
);
