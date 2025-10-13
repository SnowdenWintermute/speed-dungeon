import { useGameStore } from "@/stores/game-store";
import { ActionButtonCategory } from ".";
import { ItemsMenuState } from "./items";
import { viewEquipmentHotkey } from "./equipped-items";
import { letterFromKeyCode } from "@/hotkeys";
import { ConsideringItemMenuState } from "./considering-item";
import { Inventory, Item } from "@speed-dungeon/common";
import {
  setViewingAbilityTreeAsFreshStack,
  toggleInventoryHotkey,
} from "./common-buttons/open-inventory";
import { AppStore } from "@/mobx-stores/app-store";
import { MENU_STATE_POOL } from "@/mobx-stores/action-menu/menu-state-pool";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import { MenuStateType } from "./menu-state-type";

export class InventoryItemsMenuState extends ItemsMenuState {
  constructor() {
    const viewEquipmentButton = new ActionMenuButtonProperties(
      () => `Equipped (${letterFromKeyCode(viewEquipmentHotkey)})`,
      `Equipped (${letterFromKeyCode(viewEquipmentHotkey)})`,
      () => {
        AppStore.get().actionMenuStore.pushStack(
          MENU_STATE_POOL[MenuStateType.ViewingEquipedItems]
        );
      }
    );
    viewEquipmentButton.dedicatedKeys = [viewEquipmentHotkey];

    super(
      MenuStateType.InventoryItems,
      { text: "Cancel", hotkeys: ["KeyI", toggleInventoryHotkey] },
      (item: Item) => {
        AppStore.get().focusStore.selectItem(item);
        AppStore.get().actionMenuStore.pushStack(new ConsideringItemMenuState(item));
      },
      () => {
        const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
        if (focusedCharacterResult instanceof Error) return [];
        return Inventory.getItems(focusedCharacterResult.combatantProperties.inventory);
      },
      {
        extraButtons: {
          [ActionButtonCategory.Top]: [viewEquipmentButton, setViewingAbilityTreeAsFreshStack],
        },
      }
    );
  }
}
