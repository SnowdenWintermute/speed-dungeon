import { useGameStore } from "@/stores/game-store";
import { ActionButtonCategory, ActionMenuButtonProperties, MenuStateType } from ".";
import { immerable } from "immer";
import { ItemsMenuState } from "./items";
import { EquippedItemsMenuState } from "./equipped-items";

export class InventoryItemsMenuState extends ItemsMenuState {
  [immerable] = true;
  page = 1;
  numPages = 1;
  constructor() {
    const viewEquipmentButton = new ActionMenuButtonProperties("View Equipped", () => {
      useGameStore.getState().mutateState((state) => {
        state.stackedMenuStates.push(new EquippedItemsMenuState());
      });
    });
    viewEquipmentButton.dedicatedKeys = ["KeyF"];

    super(
      MenuStateType.InventoryItems,
      { text: "Close Inventory", hotkeys: ["KeyI", "KeyS"] },
      {
        [ActionButtonCategory.Top]: [viewEquipmentButton],
      }
    );
  }
}
