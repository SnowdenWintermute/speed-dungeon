import { getCurrentMenu, useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import {
  CONSUMABLE_TYPE_STRINGS,
  CombatantEquipment,
  Consumable,
  ConsumableType,
  Equipment,
  Inventory,
  Item,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { setAlert } from "@/app/components/alerts";
import { ConsideringItemMenuState } from "./considering-item";
import { immerable } from "immer";
import selectItem from "@/utils/selectItem";
import setItemHovered from "@/utils/set-item-hovered";
import createPageButtons from "./create-page-buttons";
import { takeItem } from "../../ItemsOnGround/ItemOnGround";

export class ItemsMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages: number = 1;
  constructor(
    public type:
      | MenuStateType.InventoryItems
      | MenuStateType.ViewingEquipedItems
      | MenuStateType.ItemsOnGround,
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
        state.viewingDropShardsModal = false;
      });
    });
    closeInventory.dedicatedKeys = [...this.closeMenuTextAndHotkeys.hotkeys, "Escape"];
    toReturn[ActionButtonCategory.Top].push(closeInventory);

    let focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult);
      return toReturn;
    }

    const partyResult = useGameStore.getState().getParty();
    if (partyResult instanceof Error) {
      setAlert(partyResult);
      return toReturn;
    }

    const itemsToShow = (() => {
      switch (this.type) {
        case MenuStateType.InventoryItems:
          return Inventory.getItems(focusedCharacterResult.combatantProperties.inventory);
        case MenuStateType.ViewingEquipedItems:
          return Object.values(
            CombatantEquipment.getAllEquippedItems(focusedCharacterResult.combatantProperties)
          );
        case MenuStateType.ItemsOnGround:
          return partyResult.currentRoom.items;
      }
    })();

    const equipment: Equipment[] = [];
    const consumablesByType: Partial<Record<ConsumableType, Consumable[]>> = {};

    const buttonTextPrefix = this.type === MenuStateType.ItemsOnGround ? "" : "";

    for (const item of itemsToShow) {
      if (item instanceof Equipment) {
        equipment.push(item);
      } else if (item instanceof Consumable) {
        const { consumableType } = item;
        if (!consumablesByType[consumableType]) consumablesByType[consumableType] = [item];
        else consumablesByType[consumableType]!.push(item);
      }
    }

    const itemButtonClickHandler = (() => {
      switch (this.type) {
        case MenuStateType.InventoryItems:
        case MenuStateType.ViewingEquipedItems:
          return (item: Item) => {
            selectItem(item);
            useGameStore.getState().mutateState((state) => {
              state.stackedMenuStates.push(new ConsideringItemMenuState(item));
            });
          };
        case MenuStateType.ItemsOnGround:
          return takeItem;
      }
    })();

    for (const [consumableType, consumables] of iterateNumericEnumKeyedRecord(consumablesByType)) {
      const firstConsumableOfThisType = consumables[0];
      if (!firstConsumableOfThisType) continue;
      let consumableName = buttonTextPrefix + CONSUMABLE_TYPE_STRINGS[consumableType];
      if (consumables.length > 1) consumableName += ` (${consumables.length})`;

      const button = new ActionMenuButtonProperties(consumableName, () => {
        itemButtonClickHandler(firstConsumableOfThisType);
      });
      button.mouseEnterHandler = () => itemButtonMouseEnterHandler(firstConsumableOfThisType);
      button.mouseLeaveHandler = () => itemButtonMouseLeaveHandler();
      button.focusHandler = () => itemButtonMouseEnterHandler(firstConsumableOfThisType);
      button.blurHandler = () => itemButtonMouseLeaveHandler();
      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    for (const item of equipment) {
      const button = new ActionMenuButtonProperties(
        buttonTextPrefix + item.entityProperties.name,
        () => {
          itemButtonClickHandler(item);
        }
      );

      button.mouseEnterHandler = () => itemButtonMouseEnterHandler(item);
      button.mouseLeaveHandler = () => itemButtonMouseLeaveHandler();
      button.focusHandler = () => itemButtonMouseEnterHandler(item);
      button.blurHandler = () => itemButtonMouseLeaveHandler();
      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    createPageButtons(this, toReturn);

    if (!this.extraButtons) return toReturn;

    for (const [category, buttons] of iterateNumericEnumKeyedRecord(this.extraButtons)) {
      for (const button of buttons) toReturn[category].push(button);
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
