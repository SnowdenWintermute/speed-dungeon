import { ActionButtonCategory, ActionButtonsByCategory, ActionMenuState, MenuStateType } from ".";
import { createCancelButton } from "./common-buttons/cancel";
import {
  setInventoryAsFreshStack,
  setViewingAbilityTreeHotkey,
} from "./common-buttons/open-inventory";
import { ConsideringAbilityTreeColumnMenuState } from "./considering-tree-ability-column";
import { ArrayUtils } from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";

export class AbilityTreeMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.ViewingAbilityTree, 1);
  }

  getButtonProperties() {
    const toReturn = new ActionButtonsByCategory();
    toReturn[ActionButtonCategory.Top].push(
      createCancelButton([setViewingAbilityTreeHotkey], () => {
        AppStore.get().focusStore.combatantAbility.clear();
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
          AppStore.get().actionMenuStore.pushStack(
            new ConsideringAbilityTreeColumnMenuState(number)
          );
        }
      );
      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    return toReturn;
  }
}
