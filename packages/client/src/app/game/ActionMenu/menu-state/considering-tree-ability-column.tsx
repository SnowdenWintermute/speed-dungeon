import { useGameStore } from "@/stores/game-store";
import { ActionMenuState } from ".";
import { createCancelButton } from "./common-buttons/cancel";
import {
  ABILITY_TREES,
  ABILITY_TREE_DIMENSIONS,
  COMBATANT_TRAIT_DESCRIPTIONS,
  COMBAT_ACTION_NAME_STRINGS,
  EMPTY_ABILITY_TREE,
} from "@speed-dungeon/common";
import { createPageButtons } from "./create-page-buttons";
import { setAlert } from "@/app/components/alerts";
import { ReactNode } from "react";
import { ConsideringCombatantAbilityMenuState } from "./considering-tree-ability";
import { AbilityType } from "@speed-dungeon/common";
import { getAbilityIcon } from "../../character-sheet/ability-tree/ability-icons";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory, ActionButtonsByCategory } from "./action-buttons-by-category";

export class ConsideringAbilityTreeColumnMenuState extends ActionMenuState {
  constructor(public readonly columnIndex: number) {
    super(MenuStateType.ConsideringAbilityTreeColumn, 5);
    this.pageIndex = columnIndex;
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
          const iconGetter = getAbilityIcon(ability);
          iconOption = iconGetter ? iconGetter("h-full p-2 fill-slate-400") : "icon";
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
            if (ability === undefined) {
              AppStore.get().focusStore.combatantAbility.clearDetailed();
            } else {
              AppStore.get().focusStore.combatantAbility.setDetailed(ability);
              AppStore.get().actionMenuStore.pushStack(
                new ConsideringCombatantAbilityMenuState(
                  withSubjobAbilities.filter((item) => item !== undefined),
                  index
                )
              );
            }
          }
        );

        button.mouseEnterHandler = button.focusHandler = () => {
          if (ability === undefined) {
            AppStore.get().focusStore.combatantAbility.clearHovered();
          } else {
            AppStore.get().focusStore.combatantAbility.setHovered(ability);
          }
        };
        button.mouseLeaveHandler = button.blurHandler = () => {
          AppStore.get().focusStore.combatantAbility.clearHovered();
        };

        button.shouldBeDisabled = nameAsString === undefined;

        toReturn[ActionButtonCategory.Numbered].push(button);
      });
    });

    createPageButtons(toReturn, ABILITY_TREE_DIMENSIONS.x);

    return toReturn;
  }
}
