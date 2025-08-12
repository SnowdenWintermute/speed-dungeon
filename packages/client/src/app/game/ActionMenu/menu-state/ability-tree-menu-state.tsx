import { immerable } from "immer";
import { ActionButtonCategory, ActionButtonsByCategory, ActionMenuState, MenuStateType } from ".";
import { createCancelButton } from "./common-buttons/cancel";
import {
  setInventoryAsFreshStack,
  setViewingAbilityTreeHotkey,
} from "./common-buttons/open-inventory";

export class AbilityTreeMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages: number = 1;
  type = MenuStateType.ViewingAbilityTree;
  getButtonProperties() {
    const toReturn = new ActionButtonsByCategory();
    toReturn[ActionButtonCategory.Top].push(createCancelButton([setViewingAbilityTreeHotkey]));
    toReturn[ActionButtonCategory.Top].push(setInventoryAsFreshStack);
    return toReturn;
  }
}
