import {
  AbilityTree,
  AbilityTreeAbility,
  AbilityUtils,
  CombatantAbilityProperties,
  getAbilityTreeAbilityNameString,
} from "@speed-dungeon/common";
import { getAbilityIcon } from "./ability-icons";
import { AbilityTreeButton } from "./AbilityTreeButton";
import { useRef } from "react";
import { PrerequisiteArrows } from "./PrerequisiteArrows";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "../../ActionMenu/menu-state/menu-state-type";

export const CharacterClassAbilityTree = observer(
  ({ abilityTree, isSupportClass }: { abilityTree: AbilityTree; isSupportClass: boolean }) => {
    const { actionMenuStore, focusStore } = AppStore.get();
    const currentMenu = actionMenuStore.getCurrentMenu();
    const detailedAbilityOption = focusStore.combatantAbility.get().detailed;

    const cellRefs = useRef<
      Record<string, { element: HTMLDivElement; prerequisites: AbilityTreeAbility[] }>
    >({});

    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();

    const { combatantProperties } = focusedCharacter;

    // @PERF - the way we draw arrows might be worth revisiting
    return (
      <div className="relative h-fit" key={focusedCharacter.entityProperties.id}>
        <PrerequisiteArrows cellRefs={cellRefs} />
        <div
          className="absolute flex w-fit -right-2 -top-2 opacity-50 z-0"
          style={{ height: `calc(100% + 1rem)` }}
        >
          {abilityTree.columns.map((column, columnIndex) => {
            const shouldHighlight =
              currentMenu.type === MenuStateType.ConsideringAbilityTreeColumn &&
              currentMenu.setPageIndex(columnIndex);
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
                    <div
                      key={columnIndex + rowIndex}
                      className={`h-24 w-full ${highlightedStyle}`}
                    />
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
                    const buttonContent = abilityIconOption ? (
                      <div className="h-full p-2 max-w-full overflow-hidden flex justify-center">
                        {abilityIconOption("h-full fill-slate-400 stroke-slate-400")}
                      </div>
                    ) : (
                      <div className="text-wrap text-center max-w-full overflow-hidden text-ellipsis p-1">
                        {abilityName}
                      </div>
                    );

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
                          ability={ability}
                          abilityLevel={CombatantAbilityProperties.getAbilityLevel(
                            combatantProperties,
                            ability
                          )}
                          buttonContent={buttonContent}
                          isAllocatable={isAllocatable}
                          isDetailed={isDetailed}
                        />
                      </div>
                    );
                  }

                  return (
                    <li
                      key={"column" + rowIndex + "row" + rowIndex}
                      className="mb-4 last:mb-0 flex"
                    >
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
);
