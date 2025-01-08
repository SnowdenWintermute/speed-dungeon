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
import ShardsIcon from "../../../../../public/img/game-ui-icons/shards.svg";
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
        (
          <div className="flex justify-between w-full pr-2">
            <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
              {CONSUMABLE_TYPE_STRINGS[consumableType]}
            </div>
            <div className="w-fit flex h-full items-center">
              <span className="mr-1">{price}</span>
              <ShardsIcon className="h-[20px] fill-slate-400" />
            </div>
          </div>
        ),
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
