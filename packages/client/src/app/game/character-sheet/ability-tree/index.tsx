import Divider from "@/app/components/atoms/Divider";
import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { useGameStore } from "@/stores/game-store";
import {
  ABILITY_TREES,
  AbilityTree,
  ClientToServerEvent,
  CombatantProperties,
  ERROR_MESSAGES,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import React from "react";
import { MenuStateType } from "../../ActionMenu/menu-state";
import AbilityTreeDetailedAbility from "./AbilityTreeDetailedAbility";
import { getAbilityTreeAbilityNameString } from "@speed-dungeon/common";
import { IconName, SVG_ICONS } from "@/app/icons";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { websocketConnection } from "@/singletons/websocket-connection";
import { getAbilityIcon } from "./ability-icons";

export default function AbilitySelection() {
  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;

  const { combatantClass } = focusedCharacterOption.combatantProperties;

  const abilityTree = ABILITY_TREES[combatantClass];

  const sliced = cloneDeep(abilityTree);
  sliced.columns = sliced.columns.map((column) => column.slice(0, 2));

  const { unspentAbilityPoints } = focusedCharacterOption.combatantProperties;

  return (
    <div
      style={{ width: `calc(100% + 2px)` }}
      className="flex border border-slate-400 bg-slate-700 p-4 absolute top-[-1px] left-0 h-fit ml-[-1px]"
    >
      <HoverableTooltipWrapper tooltipText="Unspent ability points">
        <div className="h-5 fill-slate-400 absolute flex items-center">
          <div className="h-full mr-1">
            {SVG_ICONS[IconName.PlusSign](
              `h-full ${unspentAbilityPoints ? "fill-yellow-400" : "fill-slate-400"}`
            )}
          </div>
          <div>{focusedCharacterOption.combatantProperties.unspentAbilityPoints}</div>
        </div>
      </HoverableTooltipWrapper>
      <div className="flex flex-col  mr-4">
        <div className="text-lg flex justify-center">
          <h3>Warrior (level 6)</h3>
        </div>
        <Divider extraStyles="mb-4" />
        <div className="w-fit">
          <AbilityTreeDisplay abilityTree={abilityTree} />
          <div className="text-lg mt-4 flex justify-center">
            <h3>Rogue (level 3)</h3>
          </div>
          <Divider extraStyles="mb-4" />
          <AbilityTreeDisplay abilityTree={sliced} />
        </div>
      </div>
      <AbilityTreeDetailedAbility />
    </div>
  );
}

function AbilityTreeDisplay({ abilityTree }: { abilityTree: AbilityTree }) {
  const currentMenu = useGameStore.getState().getCurrentMenu();
  const detailedAbilityOption = useGameStore.getState().detailedCombatantAbility;

  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;

  return (
    <div className="relative h-fit">
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
                let highlightedStyle = "";
                if (detailedAbilityOption !== null && detailedAbilityOption === ability)
                  highlightedStyle = "bg-slate-800";

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

                  cellContent = (
                    <HotkeyButton
                      className="h-20 w-20 border border-slate-400 bg-slate-700 hover:bg-slate-950 relative flex items-center justify-center"
                      onClick={() => {
                        websocketConnection.emit(ClientToServerEvent.AllocateAbilityPoint, {
                          characterId: focusedCharacterOption.entityProperties.id,
                          ability,
                        });
                      }}
                      onMouseEnter={() => {
                        useGameStore.getState().mutateState((state) => {
                          state.hoveredCombatantAbility = ability;
                        });
                      }}
                      onMouseLeave={() => {
                        useGameStore.getState().mutateState((state) => {
                          state.hoveredCombatantAbility = null;
                        });
                      }}
                    >
                      {abilityIconOption
                        ? abilityIconOption("h-full p-2 fill-slate-400")
                        : abilityName}
                      <div className="absolute h-5 w-5 -bottom-1 -right-1 border border-zinc-300 bg-slate-700 text-center align-middle leading-tight">
                        {CombatantProperties.getAbilityLevel(
                          focusedCharacterOption.combatantProperties,
                          ability
                        )}
                      </div>
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
    </div>
  );
}
