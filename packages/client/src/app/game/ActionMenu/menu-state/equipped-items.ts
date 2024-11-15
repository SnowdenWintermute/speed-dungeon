import { MenuStateType } from ".";
import { immerable } from "immer";
import { ItemsMenuState } from "./items";

export class EquippedItemsMenuState extends ItemsMenuState {
  [immerable] = true;
  page = 1;
  numPages = 1;
  constructor() {
    super(MenuStateType.ViewingEquipedItems, { text: "Go Back", hotkeys: ["KeyF"] });
  }
}
