import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import {
  ABILITY_TREES,
  AbilityTreeAbility,
  AbilityUtils,
  ClientIntentType,
  EMPTY_ABILITY_TREE,
} from "@speed-dungeon/common";
import React, { ReactNode, useState } from "react";
import { ConsideringCombatantAbilityActionMenuScreen } from "../../ActionMenu/menu-state/considering-tree-ability";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ActionMenuScreenType } from "../../ActionMenu/menu-state/menu-state-type";
import { observer } from "mobx-react-lite";
import { gameClientSingleton } from "@/singletons/lobby-client";

interface Props {
  ability: AbilityTreeAbility;
  abilityLevel: number;
  buttonContent: ReactNode;
  isAllocatable: { canAllocate: boolean; reasonCanNot?: string };
  isDetailed: boolean;
}

export const AbilityTreeButton = observer((props: Props) => {
  const [hovered, setHovered] = useState(false);
  const { ability, abilityLevel, buttonContent, isAllocatable, isDetailed } = props;

  const disabled = !isAllocatable.canAllocate && abilityLevel <= 0;

  return (
    <div className="bg-slate-700">
      <HotkeyButton
        className={`
        h-20 w-20 border border-slate-400 bg-slate-700  relative flex items-center justify-center
        ${disabled && "opacity-50 cursor-auto"} ${!isAllocatable.canAllocate ? "cursor-auto hover:border-white" : !isDetailed ? "cursor-pointer" : "cursor-cell hover:bg-slate-950"}
        `}
        onClick={() => {
          const focusedCharacter = clientApplication.combatantFocus.requireFocusedCharacter();

          if (!isDetailed) {
            const { focusStore, actionMenuStore } = AppStore.get();

            focusStore.combatantAbilities.setDetailed(ability);

            const { combatantProperties } = focusedCharacter;
            const { combatantClass } =
              combatantProperties.classProgressionProperties.getMainClass();
            const supportClassOption =
              combatantProperties.classProgressionProperties.getSupportClassOption();

            const abilityTree = ABILITY_TREES[combatantClass];
            const subjobTree =
              supportClassOption !== null
                ? ABILITY_TREES[supportClassOption.combatantClass]
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

                  const filteredColumn = withSubjobAbilities.filter(
                    (item): item is AbilityTreeAbility => item !== undefined
                  );
                  const newActionMenuScreen = new ConsideringCombatantAbilityActionMenuScreen(
                    filteredColumn,
                    ability
                  );

                  if (
                    actionMenuStore.currentMenuIsType(ActionMenuScreenType.ConsideringAbilityTreeAbility)
                  ) {
                    actionMenuStore.popStack();
                  }

                  actionMenuStore.pushStack(newActionMenuScreen);

                  break;
                }
                index += 1;
              }
            }
          } else {
            if (!isAllocatable) {
              return;
            }

            gameClientSingleton.get().dispatchIntent({
              type: ClientIntentType.AllocateAbilityPoint,
              data: {
                characterId: focusedCharacter.getEntityId(),
                ability,
              },
            });
          }
        }}
        onMouseEnter={() => {
          AppStore.get().focusStore.combatantAbilities.setHovered(ability);
          setHovered(true);
        }}
        onMouseLeave={() => {
          AppStore.get().focusStore.combatantAbilities.clearHovered();
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
});
