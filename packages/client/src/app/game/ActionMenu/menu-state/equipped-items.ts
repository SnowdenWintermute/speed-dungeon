import { MenuStateType } from ".";
import { immerable } from "immer";
import { ItemsMenuState } from "./items";
import { HOTKEYS } from "@/hotkeys";

export const viewEquipmentHotkey = HOTKEYS.ALT_1;
export class EquippedItemsMenuState extends ItemsMenuState {
  [immerable] = true;
  page = 1;
  numPages = 1;
  constructor() {
    super(MenuStateType.ViewingEquipedItems, { text: "Go Back", hotkeys: [viewEquipmentHotkey] });
  }
}
