import { GameState } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import { UIState } from "@/stores/ui-store";
import { AlertState } from "@/stores/alert-store";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import {
  ClientToServerEvent,
  CombatActionType,
  ConsumableType,
  ERROR_MESSAGES,
  ItemPropertiesType,
  formatConsumableType,
} from "@speed-dungeon/common";
import { setAlert } from "@/app/components/alerts";
import { websocketConnection } from "@/singletons/websocket-connection";

export class InventoryItemsMenuState implements ActionMenuState {
  type = MenuStateType.InventoryItems;
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

    // const toggleViewEquippedItems = (new ActionMenuButtonProperties("Show Equipped", () => {
    //   this.gameState.mutateState((state) => {
    //     state.menuState = state.baseMenuState;
    //   });
    // }));
    // toggleViewEquippedItems.dedicatedKeys = ["KeyF"];

    let focusedCharacterResult = this.gameState.getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(this.alertState.mutateState, ERROR_MESSAGES.COMBATANT.NOT_FOUND);
      console.error(focusedCharacterResult);
      return toReturn;
    }
    const { combatantProperties, entityProperties } = focusedCharacterResult;

    const equipmentIds = [];
    const consumableIdsByType: Partial<Record<ConsumableType, string[]>> = {};

    for (const item of Object.values(combatantProperties.inventory.items)) {
      switch (item.itemProperties.type) {
        case ItemPropertiesType.Equipment:
          equipmentIds.push(item.entityProperties.id);
          break;
        case ItemPropertiesType.Consumable:
          const { consumableType } = item.itemProperties.consumableProperties;
          if (!consumableIdsByType[consumableType])
            consumableIdsByType[consumableType] = [item.entityProperties.id];
          else consumableIdsByType[consumableType]!.push(item.entityProperties.id);
      }
    }
    for (const [consumableTypeKey, ids] of Object.entries(consumableIdsByType)) {
      let consumableName = formatConsumableType(parseInt(consumableTypeKey));
      if (ids.length > 1) consumableName += ` (${ids.length})`;

      const button = new ActionMenuButtonProperties(consumableName, () => {
        websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
          characterId: entityProperties.id,
          combatActionOption: {
            type: CombatActionType.ConsumableUsed,
            itemId: ids[0]!,
          },
        });
      });
      toReturn[ActionButtonCategory.Numbered].push(button);
    }
    // for (const itemId of equipmentIds) {
    //   gameActions.push({
    //     type: GameActionType.SelectItem,
    //     itemId,
    //     stackSize: null,
    //   });
    // }

    return toReturn;
  }
}
