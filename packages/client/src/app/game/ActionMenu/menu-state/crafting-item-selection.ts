import { ActionButtonCategory, MenuStateType } from ".";
import { immerable } from "immer";
import { ItemsMenuState } from "./items";
import { toggleInventoryHotkey } from "./base";

export class CraftingItemSelectionMenuState extends ItemsMenuState {
  [immerable] = true;
  page = 1;
  numPages = 1;
  constructor() {
    super(
      MenuStateType.CraftingItemSelection,
      { text: "Close Inventory", hotkeys: ["KeyI", toggleInventoryHotkey] },
      {
        [ActionButtonCategory.Top]: [],
      }
    );
  }
}
