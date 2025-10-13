import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { websocketConnection } from "@/singletons/websocket-connection";
import {
  ABILITY_TREES,
  AbilityTreeAbility,
  AbilityUtils,
  ClientToServerEvent,
  EMPTY_ABILITY_TREE,
  EntityId,
} from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";
import React, { ReactNode, useState } from "react";
import { MenuStateType } from "../../ActionMenu/menu-state";
import { ConsideringCombatantAbilityMenuState } from "../../ActionMenu/menu-state/considering-tree-ability";
import { AppStore } from "@/mobx-stores/app-store";

interface Props {
  focusedCharacterId: EntityId;
  ability: AbilityTreeAbility;
  abilityLevel: number;
  buttonContent: ReactNode;
  isAllocatable: { canAllocate: boolean; reasonCanNot?: string };
  isDetailed: boolean;
}

export default function AbilityTreeButton(props: Props) {
  const [hovered, setHovered] = useState(false);
  const {
    focusedCharacterId: characterId,
    ability,
    abilityLevel,
    buttonContent,
    isAllocatable,
    isDetailed,
  } = props;

  const disabled = !isAllocatable.canAllocate && abilityLevel <= 0;

  return (
    <div className="bg-slate-700">
      <HotkeyButton
        className={`
        h-20 w-20 border border-slate-400 bg-slate-700  relative flex items-center justify-center
        ${disabled && "opacity-50 cursor-auto"} ${!isAllocatable.canAllocate ? "cursor-auto hover:border-white" : !isDetailed ? "cursor-pointer" : "cursor-cell hover:bg-slate-950"}
        `}
        onClick={() => {
          if (!isDetailed) {
            const { focusStore, actionMenuStore } = AppStore.get();

            focusStore.combatantAbility.setDetailed(ability);

            useGameStore.getState().mutateState((state) => {
              const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
              if (focusedCharacterResult instanceof Error) {
                return <div />;
              }

              const { combatantProperties } = focusedCharacterResult;
              const { combatantClass } = combatantProperties;

              const abilityTree = ABILITY_TREES[combatantClass];
              const subjobTree = combatantProperties.supportClassProperties
                ? ABILITY_TREES[combatantProperties.supportClassProperties.combatantClass]
                : EMPTY_ABILITY_TREE;

              let indexIfInThisColumn = null;
              let columnIndex = -1;
              for (const column of abilityTree.columns) {
                columnIndex += 1;
                if (indexIfInThisColumn !== null) break;
                let index = 0;

                const withSubjobAbilities = [
                  ...column,
                  ...subjobTree.columns[columnIndex]!.slice(0, 2),
                ];

                for (const abilityToCheck of withSubjobAbilities) {
                  if (abilityToCheck === undefined) continue;
                  if (AbilityUtils.abilitiesAreEqual(abilityToCheck, ability)) {
                    indexIfInThisColumn = index;

                    const newMenuState = new ConsideringCombatantAbilityMenuState(
                      withSubjobAbilities.filter((item) => item !== undefined),
                      indexIfInThisColumn
                    );

                    if (
                      actionMenuStore.currentMenuIsType(MenuStateType.ConsideringAbilityTreeAbility)
                    ) {
                      actionMenuStore.popStack();
                    }

                    actionMenuStore.pushStack(newMenuState);

                    break;
                  }
                  index += 1;
                }
              }
            });
          } else {
            if (!isAllocatable) return;
            websocketConnection.emit(ClientToServerEvent.AllocateAbilityPoint, {
              characterId,
              ability,
            });
          }
        }}
        onMouseEnter={() => {
          AppStore.get().focusStore.combatantAbility.setHovered(ability);
          setHovered(true);
        }}
        onMouseLeave={() => {
          AppStore.get().focusStore.combatantAbility.clearHovered();
          setHovered(false);
        }}
      >
        {buttonContent}
        <div className="absolute h-5 w-5 -bottom-1 -right-1 border border-zinc-300 bg-slate-700 text-center align-middle leading-tight">
          {abilityLevel}
        </div>
      </HotkeyButton>
    </div>
  );
}
