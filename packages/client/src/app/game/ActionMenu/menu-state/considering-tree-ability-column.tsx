import { immerable } from "immer";
import { useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import { createCancelButton } from "./common-buttons/cancel";
import {
  ABILITY_TREES,
  ABILITY_TREE_DIMENSIONS,
  COMBATANT_TRAIT_DESCRIPTIONS,
  COMBAT_ACTION_NAME_STRINGS,
  EMPTY_ABILITY_TREE,
} from "@speed-dungeon/common";
import createPageButtons from "./create-page-buttons";
import { setAlert } from "@/app/components/alerts";
import { getAbilityIcon } from "../../icons/get-action-icon";
import { ReactNode } from "react";
import { ConsideringCombatantAbilityMenuState } from "./considering-tree-ability";
import { AbilityType } from "@speed-dungeon/common";

export class ConsideringAbilityTreeColumnMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages: number = 5;
  type = MenuStateType.ConsideringAbilityTreeColumn;

  alwaysShowPageOne = false;
  constructor(public readonly columnNumber: number) {
    this.numPages = 5;
    this.page = columnNumber;
  }

  getButtonProperties() {
    const toReturn = new ActionButtonsByCategory();
    toReturn[ActionButtonCategory.Top].push(createCancelButton([]));

    const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult);
      return toReturn;
    }

    const { combatantProperties } = focusedCharacterResult;
    const { combatantClass } = combatantProperties;
    const abilityTree = ABILITY_TREES[combatantClass];
    const subjobTree = combatantProperties.supportClassProperties
      ? ABILITY_TREES[combatantProperties.supportClassProperties.combatantClass]
      : EMPTY_ABILITY_TREE;

    abilityTree.columns.forEach((column, columnIndex) => {
      const subjobTreeColumn = subjobTree.columns[columnIndex] || [];
      const withSubjobAbilities = [...column, ...subjobTreeColumn.slice(0, 2)];

      let numAbilitiesPushed = -1;
      withSubjobAbilities.forEach((ability, rowIndex) => {
        let nameAsString = undefined;
        let iconOption: ReactNode = <div />;
        if (ability !== undefined) {
          if (ability.type === AbilityType.Action) {
            nameAsString = COMBAT_ACTION_NAME_STRINGS[ability.actionName];
          } else {
            nameAsString = COMBATANT_TRAIT_DESCRIPTIONS[ability.traitType].name;
          }
          iconOption = getAbilityIcon(ability, focusedCharacterResult.combatantProperties);
          numAbilitiesPushed += 1;
        }

        const index = numAbilitiesPushed;

        const button = new ActionMenuButtonProperties(
          () => (
            <div className="flex justify-between h-full w-full pr-2">
              <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
                {nameAsString}
              </div>
              <div className="h-full flex items-center">{iconOption}</div>
            </div>
          ),
          nameAsString || "",
          () => {
            useGameStore.getState().mutateState((state) => {
              state.detailedCombatantAbility = ability === undefined ? null : ability;
              if (ability !== undefined)
                state.stackedMenuStates.push(
                  new ConsideringCombatantAbilityMenuState(
                    withSubjobAbilities.filter((item) => item !== undefined),
                    index
                  )
                );
            });
          }
        );

        button.mouseEnterHandler = button.focusHandler = () =>
          useGameStore.getState().mutateState((state) => {
            state.hoveredCombatantAbility = ability === undefined ? null : ability;
          });
        button.mouseLeaveHandler = button.blurHandler = () =>
          useGameStore.getState().mutateState((state) => {
            state.hoveredCombatantAbility = null;
          });

        button.shouldBeDisabled = nameAsString === undefined;

        toReturn[ActionButtonCategory.Numbered].push(button);
      });
    });

    createPageButtons(this, toReturn, ABILITY_TREE_DIMENSIONS.x);

    return toReturn;
  }
}
