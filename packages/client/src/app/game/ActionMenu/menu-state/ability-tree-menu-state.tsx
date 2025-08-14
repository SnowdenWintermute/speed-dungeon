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
import { createArrayFilledWithSequentialNumbers } from "@speed-dungeon/common";
import { ConsideringAbilityTreeColumnMenuState } from "./considering-tree-ability-column";

export class AbilityTreeMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages: number = 1;
  type = MenuStateType.ViewingAbilityTree;
  alwaysShowPageOne = false;
  getButtonProperties() {
    const toReturn = new ActionButtonsByCategory();
    toReturn[ActionButtonCategory.Top].push(createCancelButton([setViewingAbilityTreeHotkey]));
    toReturn[ActionButtonCategory.Top].push(setInventoryAsFreshStack);

    for (const number of createArrayFilledWithSequentialNumbers(5, 1)) {
      const nameAsString = `Column ${number}`;
      const button = new ActionMenuButtonProperties(
        (
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
