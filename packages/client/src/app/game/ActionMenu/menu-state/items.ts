import { getCurrentMenu, useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import {
  ConsumableType,
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

export class ItemsMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages = 1;
  constructor(
    public type: MenuStateType.InventoryItems | MenuStateType.ViewingEquipedItems,
    public closeMenuTextAndHotkeys: { text: string; hotkeys: string[] },
    public extraButtons?: Partial<Record<ActionButtonCategory, ActionMenuButtonProperties[]>>
  ) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const closeInventory = new ActionMenuButtonProperties(this.closeMenuTextAndHotkeys.text, () => {
      useGameStore.getState().mutateState((state) => {
        state.stackedMenuStates.pop();
      });
    });
    closeInventory.dedicatedKeys = [...this.closeMenuTextAndHotkeys.hotkeys, "Escape"];
    toReturn[ActionButtonCategory.Top].push(closeInventory);

    let focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult.message);
      return toReturn;
    }

    const itemsToShow = (() => {
      switch (this.type) {
        case MenuStateType.InventoryItems:
          return focusedCharacterResult.combatantProperties.inventory.items;
        case MenuStateType.ViewingEquipedItems:
          return Object.values(focusedCharacterResult.combatantProperties.equipment);
      }
    })();

    const equipment: Item[] = [];
    const consumablesByType: Partial<Record<ConsumableType, Item[]>> = {};

    for (const item of itemsToShow) {
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
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.push(new ConsideringItemMenuState(firstConsumableOfThisType));
        });
      });
      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    for (const item of equipment) {
      const button = new ActionMenuButtonProperties(item.entityProperties.name, () => {
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.push(new ConsideringItemMenuState(item));
        });
      });
      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    const numPages = Math.ceil(
      toReturn[ActionButtonCategory.Numbered].length / ACTION_MENU_PAGE_SIZE
    );

    useGameStore.getState().mutateState((state) => {
      getCurrentMenu(state).numPages = numPages;
    });

    if (numPages > 1) {
      const previousPageButton = new ActionMenuButtonProperties("Previous", () => {
        useGameStore.getState().mutateState((state) => {
          const newPage = changePage(this.page, numPages, NextOrPrevious.Previous);
          getCurrentMenu(state).page = newPage;
        });
      });
      previousPageButton.dedicatedKeys = ["KeyW", "ArrowLeft"];
      toReturn[ActionButtonCategory.Bottom].push(previousPageButton);

      const nextPageButton = new ActionMenuButtonProperties("Next", () => {
        useGameStore.getState().mutateState((state) => {
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

    if (!this.extraButtons) return toReturn;

    for (const [category, buttons] of Object.entries(this.extraButtons)) {
      const categoryAsEnum = parseInt(category) as ActionButtonCategory;
      for (const button of buttons) toReturn[categoryAsEnum].push(button);
    }

    return toReturn;
  }
}
