import { useGameStore } from "@/stores/game-store";
import {
  AbilityTree,
  AbilityTreeAbility,
  AbilityUtils,
  CombatantAbilityProperties,
  ERROR_MESSAGES,
  getAbilityTreeAbilityNameString,
} from "@speed-dungeon/common";
import { MenuStateType } from "../../ActionMenu/menu-state";
import { getAbilityIcon } from "./ability-icons";
import AbilityTreeButton from "./AbilityTreeButton";
import { useEffect, useLayoutEffect, useRef } from "react";
import PrerequisiteArrows from "./PrerequisiteArrows";

export default function CharacterClassAbilityTree({
  abilityTree,
  isSupportClass,
}: {
  abilityTree: AbilityTree;
  isSupportClass: boolean;
}) {
  const currentMenu = useGameStore.getState().getCurrentMenu();
  const detailedAbilityOption = useGameStore.getState().detailedCombatantAbility;

  const cellRefs = useRef<
    Record<string, { element: HTMLDivElement; prerequisites: AbilityTreeAbility[] }>
  >({});

  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;

  const { combatantProperties } = focusedCharacterOption;

  return (
    <div className="relative h-fit">
      <PrerequisiteArrows cellRefs={cellRefs} />
      <div
        className="absolute flex w-fit -right-2 -top-2 opacity-50 z-0"
        style={{ height: `calc(100% + 1rem)` }}
      >
        {abilityTree.columns.map((column, columnIndex) => {
          const shouldHighlight =
            currentMenu.type === MenuStateType.ConsideringAbilityTreeColumn &&
            currentMenu.page - 1 === columnIndex;
          return (
            <div
              key={columnIndex}
              className={`${shouldHighlight ? "bg-slate-800 " : ""} w-24 h-full`}
            >
              {column.map((ability, rowIndex) => {
                const isDetailed =
                  detailedAbilityOption !== null &&
                  ability !== undefined &&
                  AbilityUtils.abilitiesAreEqual(detailedAbilityOption, ability);

                let highlightedStyle = "";
                if (isDetailed) highlightedStyle = "bg-slate-800";

                return (
                  <div key={columnIndex + rowIndex} className={`h-24 w-full ${highlightedStyle}`} />
                );
              })}
            </div>
          );
        })}
      </div>
      <ul className="list-none flex relative top-0 left-0 z-10">
        {abilityTree.columns.map((column, columnIndex) => (
          <li key={"column" + columnIndex} className="mr-4 last:mr-0">
            <ul className="list-none">
              {column.map((ability, rowIndex) => {
                let cellContent = <div className="h-20 w-20"></div>;
                if (ability !== undefined) {
                  const abilityIconOption = getAbilityIcon(ability);
                  const abilityName = getAbilityTreeAbilityNameString(ability);
                  const buttonContent = abilityIconOption
                    ? abilityIconOption("h-full p-2 fill-slate-400 stroke-slate-400")
                    : abilityName;

                  const isAllocatable = CombatantAbilityProperties.canAllocateAbilityPoint(
                    combatantProperties,
                    ability,
                    isSupportClass
                  );

                  const isDetailed =
                    detailedAbilityOption !== null &&
                    ability !== undefined &&
                    AbilityUtils.abilitiesAreEqual(detailedAbilityOption, ability);

                  cellContent = (
                    <div
                      ref={(element) => {
                        if (element)
                          cellRefs.current[JSON.stringify(ability)] = {
                            element,
                            prerequisites: AbilityUtils.getPrerequisites(ability),
                          };
                      }}
                    >
                      <AbilityTreeButton
                        focusedCharacterId={focusedCharacterOption.entityProperties.id}
                        ability={ability}
                        abilityLevel={CombatantAbilityProperties.getAbilityLevel(
                          combatantProperties,
                          ability
                        )}
                        buttonContent={buttonContent}
                        isAllocatable={isAllocatable.canAllocate}
                        isDetailed={isDetailed}
                      />
                    </div>
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
    </div>
  );
}
