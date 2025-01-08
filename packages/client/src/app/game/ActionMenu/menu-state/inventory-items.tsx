import { useGameStore } from "@/stores/game-store";
import { ActionButtonCategory, ActionMenuButtonProperties, MenuStateType } from ".";
import { immerable } from "immer";
import { ItemsMenuState } from "./items";
import { EquippedItemsMenuState, viewEquipmentHotkey } from "./equipped-items";
import { letterFromKeyCode } from "@/hotkeys";
import { toggleInventoryHotkey } from "./base";
import selectItem from "@/utils/selectItem";
import { ConsideringItemMenuState } from "./considering-item";
import { Inventory, Item } from "@speed-dungeon/common";

export class InventoryItemsMenuState extends ItemsMenuState {
  [immerable] = true;
  page = 1;
  numPages = 1;
  constructor() {
    const viewEquipmentButton = new ActionMenuButtonProperties(
      `View Equipped (${letterFromKeyCode(viewEquipmentHotkey)})`,
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
      (item: Item) => {
        selectItem(item);
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.push(new ConsideringItemMenuState(item));
        });
      },
      () => {
        const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
        if (focusedCharacterResult instanceof Error) return [];
        return Inventory.getItems(focusedCharacterResult.combatantProperties.inventory);
      },
      {
        [ActionButtonCategory.Top]: [viewEquipmentButton],
      }
    );
  }
}
