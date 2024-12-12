import { immerable } from "immer";
import { ItemsMenuState } from "./items";
import { ActionButtonCategory, ActionMenuButtonProperties, MenuStateType } from ".";
import { inventoryItemsMenuState, useGameStore } from "@/stores/game-store";
import { letterFromKeyCode } from "@/hotkeys";
import { toggleInventoryHotkey } from "./base";
export class ItemsOnGroundMenuState extends ItemsMenuState {
  [immerable] = true;
  page = 1;
  numPages = 1;
  constructor() {
    const switchToInventoryButton = new ActionMenuButtonProperties(
      `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
      () => {
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.push(inventoryItemsMenuState);
        });
      }
    );
    switchToInventoryButton.dedicatedKeys = [toggleInventoryHotkey];

    super(
      MenuStateType.ItemsOnGround,
      { text: "Go Back", hotkeys: [] },
      { [ActionButtonCategory.Top]: [switchToInventoryButton] }
    );
  }
}
