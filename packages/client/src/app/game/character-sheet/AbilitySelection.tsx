import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { useGameStore } from "@/stores/game-store";
import {
  ABILITY_TREES,
  AbilityTree,
  COMBAT_ACTIONS,
  COMBAT_ACTION_NAME_STRINGS,
  ERROR_MESSAGES,
} from "@speed-dungeon/common";
import React from "react";

export default function AbilitySelection() {
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;

  const { combatantClass } = focusedCharacterOption.combatantProperties;

  const abilityTree = ABILITY_TREES[combatantClass];

  return (
    <div className="flex w-full">
      <AbilityTreeDisplay abilityTree={abilityTree} />
    </div>
  );
}

function AbilityTreeDisplay({ abilityTree }: { abilityTree: AbilityTree }) {
  return (
    <ul className="list-none flex">
      {abilityTree.columns.map((column, columnIndex) => (
        <li key={"column" + columnIndex} className="mr-4 last:mr-0">
          <ul className="list-none">
            {column.map((row, rowIndex) => {
              let cellContent = <div className="h-20 w-20"></div>;
              if (row !== undefined) {
                cellContent = (
                  <HotkeyButton className="h-20 w-20 border border-slate-400 hover:bg-slate-950">
                    {COMBAT_ACTION_NAME_STRINGS[row]}
                  </HotkeyButton>
                );
              }

              return (
                <li key={"column" + rowIndex + "row" + rowIndex} className="mb-4 last:mb-0">
                  {cellContent}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}
