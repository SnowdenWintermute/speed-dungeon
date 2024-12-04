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
  formatConsumableType,
} from "@speed-dungeon/common";
import { setAlert } from "@/app/components/alerts";
import { ConsideringItemMenuState } from "./considering-item";
import { immerable } from "immer";
import selectItem from "@/utils/selectItem";
import setItemHovered from "@/utils/set-item-hovered";
import createPageButtons from "./create-page-buttons";

export class ItemsMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages: number = 1;
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
        state.hoveredEntity = null;
        state.consideredItemUnmetRequirements = null;
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
        selectItem(firstConsumableOfThisType);
      });
      button.mouseEnterHandler = () => itemButtonMouseEnterHandler(firstConsumableOfThisType);
      button.mouseLeaveHandler = () => itemButtonMouseLeaveHandler();
      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    for (const item of equipment) {
      const button = new ActionMenuButtonProperties(item.entityProperties.name, () => {
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.push(new ConsideringItemMenuState(item));
        });
        selectItem(item);
      });

      button.mouseEnterHandler = () => itemButtonMouseEnterHandler(item);
      button.mouseLeaveHandler = () => itemButtonMouseLeaveHandler();
      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    createPageButtons(this, toReturn);

    if (!this.extraButtons) return toReturn;

    for (const [category, buttons] of Object.entries(this.extraButtons)) {
      const categoryAsEnum = parseInt(category) as ActionButtonCategory;
      for (const button of buttons) toReturn[categoryAsEnum].push(button);
    }

    // possible when a numbered button disapears like when equipping the last item
    // on a page
    if (this.page > this.numPages)
      useGameStore.getState().mutateState((state) => {
        getCurrentMenu(state).page = this.page - 1;
      });

    return toReturn;
  }
}

function itemButtonMouseLeaveHandler() {
  useGameStore.getState().mutateState((gameState) => {
    gameState.hoveredEntity = null;
  });
}

function itemButtonMouseEnterHandler(item: Item) {
  setItemHovered(item);
}
