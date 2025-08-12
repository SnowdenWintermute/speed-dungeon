import Divider from "@/app/components/atoms/Divider";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { useGameStore } from "@/stores/game-store";
import {
  ABILITY_TREES,
  AbilityTree,
  COMBAT_ACTIONS,
  COMBAT_ACTION_NAME_STRINGS,
  ERROR_MESSAGES,
  createArrayFilledWithSequentialNumbers,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import React from "react";

export default function AbilitySelection() {
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;

  const { combatantClass } = focusedCharacterOption.combatantProperties;

  const abilityTree = ABILITY_TREES[combatantClass];

  const sliced = cloneDeep(abilityTree);
  sliced.columns = sliced.columns.map((column) => column.slice(0, 2));

  return (
    <div
      style={{ width: `calc(100% + 2px)` }}
      className="flex border border-slate-400 bg-slate-700 p-4 absolute top-[-1px] left-0 h-fit ml-[-1px]"
    >
      <div className="w-fit mr-4">
        <div className="flex">
          <div className="mr-4 flex items-center opacity-0 pointer-events-none" id="spacer">
            <div>{2}</div>
          </div>
          <ul className="flex list-none justify-around mb-4  w-full">
            {createArrayFilledWithSequentialNumbers(abilityTree.columns.length, 1).map(
              (columnNumber) => (
                <li key={columnNumber}>{columnNumber}</li>
              )
            )}
          </ul>
        </div>

        <div className="text-lg mb-4 border-b  flex justify-center">
          <h3>Warrior (level 6)</h3>
        </div>
        <AbilityTreeDisplay abilityTree={abilityTree} />
        <div className="text-lg my-4 border-b flex justify-center">
          <h3>Rogue (level 3)</h3>
        </div>
        <AbilityTreeDisplay abilityTree={sliced} />
      </div>
      <div>
        <h3>Ability Name</h3>
        <Divider />
        Information text about all that good damage
      </div>
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
                <li key={"column" + rowIndex + "row" + rowIndex} className="mb-4 last:mb-0 flex">
                  {columnIndex === 0 && (
                    <div className="mr-4 flex items-center">
                      <div>{(rowIndex + 1) * 2}</div>
                    </div>
                  )}
                  <div>{cellContent}</div>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}
