import { immerable } from "immer";
import { useGameStore } from "@/stores/game-store";
import { ActionButtonCategory, ActionButtonsByCategory, ActionMenuState, MenuStateType } from ".";
import { createCancelButton } from "./common-buttons/cancel";
import { ABILITY_TREE_DIMENSIONS } from "@speed-dungeon/common";
import createPageButtons from "./create-page-buttons";

export class ConsideringAbilityTreeColumnMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages: number = 5;
  type = MenuStateType.ConsideringAbilityTreeColumn;
  constructor(public readonly columnNumber: number) {
    this.numPages = 5;
  }

  getButtonProperties() {
    const toReturn = new ActionButtonsByCategory();
    toReturn[ActionButtonCategory.Top].push(createCancelButton([]));

    createPageButtons(this, toReturn, ABILITY_TREE_DIMENSIONS.x);

    return toReturn;
  }
}
