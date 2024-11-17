import { useGameStore } from "@/stores/game-store";
import { ActionButtonCategory, ActionMenuButtonProperties, MenuStateType } from ".";
import { immerable } from "immer";
import { ItemsMenuState } from "./items";
import { EquippedItemsMenuState, viewEquipmentHotkey } from "./equipped-items";
import { letterFromKeyCode } from "@/hotkeys";
import { toggleInventoryHotkey } from "./base";

export class InventoryItemsMenuState extends ItemsMenuState {
  [immerable] = true;
  page = 1;
  numPages = 1;
  constructor() {
    const viewEquipmentButton = new ActionMenuButtonProperties(
      `View Equipped (${letterFromKeyCode(viewEquipmentHotkey)})`,
      () => {
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.push(new EquippedItemsMenuState());
        });
      }
    );
    viewEquipmentButton.dedicatedKeys = [viewEquipmentHotkey];

    super(
      MenuStateType.InventoryItems,
      { text: "Close Inventory", hotkeys: ["KeyI", toggleInventoryHotkey] },
      {
        [ActionButtonCategory.Top]: [viewEquipmentButton],
      }
    );
  }
}
