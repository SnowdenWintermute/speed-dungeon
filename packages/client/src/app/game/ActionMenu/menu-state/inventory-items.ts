import { GameState, getCurrentMenu, useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import { UIState, useUIStore } from "@/stores/ui-store";
import { AlertState, useAlertStore } from "@/stores/alert-store";
import {
  ConsumableType,
  ERROR_MESSAGES,
  Item,
  ItemPropertiesType,
  NextOrPrevious,
  changePage,
  formatConsumableType,
} from "@speed-dungeon/common";
import { setAlert } from "@/app/components/alerts";
import { ConsideringItemMenuState } from "./considering-item";
import { ACTION_MENU_PAGE_SIZE } from "..";
import { immerable } from "immer";

export class InventoryItemsMenuState implements ActionMenuState {
  [immerable] = true;
  type = MenuStateType.InventoryItems;
  page = 1;
  numPages = 1;
  constructor(
    public gameState: GameState,
    public uiState: UIState,
    public alertState: AlertState
  ) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const closeInventory = new ActionMenuButtonProperties("Close Inventory", () => {
      this.gameState.mutateState((state) => {
        state.menuState = state.baseMenuState;
      });
    });
    closeInventory.dedicatedKeys = ["KeyI", "KeyS", "Escape"];
    toReturn[ActionButtonCategory.Top].push(closeInventory);

    const toggleViewEquippedItems = new ActionMenuButtonProperties("Show Equipped", () => {
      // this.gameState.mutateState((state) => {
      //   state.menuState = state.baseMenuState;
      // });
    });
    toggleViewEquippedItems.dedicatedKeys = ["KeyF"];
    toReturn[ActionButtonCategory.Top].push(toggleViewEquippedItems);

    let focusedCharacterResult = this.gameState.getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(this.alertState.mutateState, ERROR_MESSAGES.COMBATANT.NOT_FOUND);
      console.error(focusedCharacterResult);
      return toReturn;
    }
    const { combatantProperties } = focusedCharacterResult;

    const equipment: Item[] = [];
    const consumablesByType: Partial<Record<ConsumableType, Item[]>> = {};

    for (const item of Object.values(combatantProperties.inventory.items)) {
      switch (item.itemProperties.type) {
        case ItemPropertiesType.Equipment:
          equipment.push(item);
          break;
        case ItemPropertiesType.Consumable:
          const { consumableType } = item.itemProperties.consumableProperties;
          if (!consumablesByType[consumableType]) consumablesByType[consumableType] = [item];
          else consumablesByType[consumableType]!.push(item);
      }
    }

    for (const [consumableTypeKey, consumables] of Object.entries(consumablesByType)) {
      const firstConsumableOfThisType = consumables[0];
      if (!firstConsumableOfThisType) continue;
      let consumableName = formatConsumableType(parseInt(consumableTypeKey));
      if (consumables.length > 1) consumableName += ` (${consumables.length})`;

      const button = new ActionMenuButtonProperties(consumableName, () => {
        this.gameState.mutateState((state) => {
          state.stackedMenuStates.push(
            new ConsideringItemMenuState(
              useGameStore.getState(),
              useUIStore.getState(),
              useAlertStore.getState(),
              firstConsumableOfThisType
            )
          );
        });
      });
      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    for (const item of equipment) {
      const button = new ActionMenuButtonProperties(item.entityProperties.name, () => {
        this.gameState.mutateState((state) => {
          state.stackedMenuStates.push(
            new ConsideringItemMenuState(
              useGameStore.getState(),
              useUIStore.getState(),
              useAlertStore.getState(),
              item
            )
          );
        });
      });
      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    // const numPagesMod = toReturn[ActionButtonCategory.Numbered].length % ACTION_MENU_PAGE_SIZE
    const numPages = Math.ceil(
      toReturn[ActionButtonCategory.Numbered].length / ACTION_MENU_PAGE_SIZE
    );

    this.gameState.mutateState((state) => {
      getCurrentMenu(state).numPages = numPages;
    });

    if (numPages > 1) {
      const previousPageButton = new ActionMenuButtonProperties("Previous", () => {
        this.gameState.mutateState((state) => {
          const newPage = changePage(this.page, numPages, NextOrPrevious.Previous);
          getCurrentMenu(state).page = newPage;
        });
      });
      previousPageButton.dedicatedKeys = ["KeyW", "ArrowLeft"];
      toReturn[ActionButtonCategory.Bottom].push(previousPageButton);

      const nextPageButton = new ActionMenuButtonProperties("Next", () => {
        this.gameState.mutateState((state) => {
          const newPage = changePage(this.page, numPages, NextOrPrevious.Next);
          getCurrentMenu(state).page = newPage;
        });
      });
      nextPageButton.dedicatedKeys = ["KeyE", "ArrowRight"];
      toReturn[ActionButtonCategory.Bottom].push(nextPageButton);
    }

    toReturn[ActionButtonCategory.Numbered] = toReturn[ActionButtonCategory.Numbered].slice(
      (this.page - 1) * ACTION_MENU_PAGE_SIZE,
      (this.page - 1) * ACTION_MENU_PAGE_SIZE + ACTION_MENU_PAGE_SIZE
    );

    return toReturn;
  }
}
