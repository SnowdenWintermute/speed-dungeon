import { useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import {
  ClientToServerEvent,
  CombatActionType,
  ERROR_MESSAGES,
  Item,
  ItemPropertiesType,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import { useAlertStore } from "@/stores/alert-store";
import { useUIStore } from "@/stores/ui-store";

export class ConsideringItemMenuState implements ActionMenuState {
  page = 1;
  numPages: number = 1;
  type = MenuStateType.ItemSelected;
  constructor(public item: Item) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const cancelButton = new ActionMenuButtonProperties("Cancel", () => {
      useGameStore.getState().mutateState((state) => {
        state.stackedMenuStates.pop();
      });
    });

    cancelButton.dedicatedKeys = ["Escape"];
    toReturn[ActionButtonCategory.Top].push(cancelButton);

    let focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(useAlertStore.getState().mutateState, ERROR_MESSAGES.COMBATANT.NOT_FOUND);
      console.error(focusedCharacterResult);
      return toReturn;
    }

    const characterId = focusedCharacterResult.entityProperties.id;
    const itemId = this.item.entityProperties.id;

    const useItemButton = (() => {
      switch (this.item.itemProperties.type) {
        case ItemPropertiesType.Equipment:
          return new ActionMenuButtonProperties("Equip", () => {
            websocketConnection.emit(ClientToServerEvent.EquipInventoryItem, {
              characterId,
              itemId,
              equipToAltSlot: useUIStore.getState().modKeyHeld,
            });
          });
        case ItemPropertiesType.Consumable:
          return new ActionMenuButtonProperties("Use", () => {
            websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
              characterId,
              combatActionOption: {
                type: CombatActionType.ConsumableUsed,
                itemId,
              },
            });
          });
      }
    })();

    useItemButton.dedicatedKeys = ["Enter", "KeyR"];
    toReturn[ActionButtonCategory.Top].push(useItemButton);

    const dropItemButton = new ActionMenuButtonProperties("Drop", () => {
      websocketConnection.emit(ClientToServerEvent.DropItem, { characterId, itemId });
      useGameStore.getState().mutateState((state) => {
        state.stackedMenuStates.pop();
      });
    });
    toReturn[ActionButtonCategory.Numbered].push(dropItemButton);

    return toReturn;
  }
}
