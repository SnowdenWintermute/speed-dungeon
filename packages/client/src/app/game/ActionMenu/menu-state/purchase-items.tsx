import { inventoryItemsMenuState, useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import { setAlert } from "@/app/components/alerts";
import createPageButtons from "./create-page-buttons";
import { immerable } from "immer";
import { HOTKEYS } from "@/hotkeys";
import clientUserControlsCombatant from "@/utils/client-user-controls-combatant";
import { toggleAssignAttributesHotkey } from "../../UnspentAttributesButton";
import {
  CONSUMABLE_TYPE_STRINGS,
  ClientToServerEvent,
  ConsumableType,
  getConsumableShardPrice,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { createCancelButton } from "./common-buttons/cancel";

export class PurchaseItemsMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages: number = 1;
  type = MenuStateType.PurchasingItems;
  constructor() {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const partyResult = useGameStore.getState().getParty();
    if (partyResult instanceof Error) {
      setAlert(partyResult);
      return toReturn;
    }

    const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult.message);
      return toReturn;
    }
    const characterId = focusedCharacterResult.entityProperties.id;
    const userControlsThisCharacter = clientUserControlsCombatant(characterId);

    toReturn[ActionButtonCategory.Top].push(createCancelButton([]));

    const inventoryButton = new ActionMenuButtonProperties(
      "Open Inventory (F)",
      "Open Inventory (F)",
      () => {
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.push(inventoryItemsMenuState);
        });
      }
    );
    inventoryButton.dedicatedKeys = [HOTKEYS.MAIN_1];
    toReturn[ActionButtonCategory.Top].push(inventoryButton);

    const purchaseableItems = [ConsumableType.HpAutoinjector, ConsumableType.MpAutoinjector];
    for (const consumableType of purchaseableItems) {
      const price = getConsumableShardPrice(partyResult.currentFloor, consumableType);
      const purchaseItemButton = new ActionMenuButtonProperties(
        `${CONSUMABLE_TYPE_STRINGS[consumableType]} (${price} shards)`,
        `${CONSUMABLE_TYPE_STRINGS[consumableType]} (${price} shards)`,
        () => {
          websocketConnection.emit(ClientToServerEvent.PurchaseItem, {
            characterId: focusedCharacterResult.entityProperties.id,
            consumableType,
          });
        }
      );
      purchaseItemButton.shouldBeDisabled =
        !userControlsThisCharacter ||
        focusedCharacterResult.combatantProperties.inventory.shards < price;
      toReturn[ActionButtonCategory.Numbered].push(purchaseItemButton);
    }

    createPageButtons(this, toReturn);

    return toReturn;
  }
}
