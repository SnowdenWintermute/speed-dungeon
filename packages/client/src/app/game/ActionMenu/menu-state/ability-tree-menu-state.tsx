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
  setInventoryAsFreshStack,
  setViewingAbilityTreeHotkey,
} from "./common-buttons/open-inventory";
import { ConsideringAbilityTreeColumnMenuState } from "./considering-tree-ability-column";
import { ArrayUtils } from "@speed-dungeon/common";

export class AbilityTreeMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages: number = 1;
  type = MenuStateType.ViewingAbilityTree;
  alwaysShowPageOne = false;
  getCenterInfoDisplayOption = null;
  getButtonProperties() {
    const toReturn = new ActionButtonsByCategory();
    toReturn[ActionButtonCategory.Top].push(
      createCancelButton([setViewingAbilityTreeHotkey], () => {
        useGameStore.getState().mutateState((state) => {
          state.hoveredCombatantAbility = null;
          state.detailedCombatantAbility = null;
        });
      })
    );
    toReturn[ActionButtonCategory.Top].push(setInventoryAsFreshStack);

    for (const number of ArrayUtils.createFilledWithSequentialNumbers(5, 1)) {
      const nameAsString = `Column ${number}`;
      const button = new ActionMenuButtonProperties(
        () => (
          <div className="flex justify-between h-full w-full pr-2">
            <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
              {nameAsString}
            </div>
          </div>
        ),
        nameAsString,
        () => {
          useGameStore.getState().mutateState((state) => {
            state.stackedMenuStates.push(new ConsideringAbilityTreeColumnMenuState(number));
          });
        }
      );
      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    return toReturn;
  }
}
