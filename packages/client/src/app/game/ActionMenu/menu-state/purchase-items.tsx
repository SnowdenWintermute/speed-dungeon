import { useGameStore } from "@/stores/game-store";
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
import { clientUserControlsCombatant } from "@/utils/client-user-controls-combatant";
import {
  CONSUMABLE_TEXT_COLOR,
  CONSUMABLE_TYPE_STRINGS,
  ClientToServerEvent,
  ConsumableType,
  createDummyConsumable,
  getConsumableShardPrice,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { ItemButtonBody, consumableGradientBg } from "./items";
import { setInventoryOpen } from "./common-buttons/open-inventory";
import { createCancelButton } from "./common-buttons/cancel";
import { PriceDisplay } from "../../character-sheet/ShardsDisplay";
import { AppStore } from "@/mobx-stores/app-store";

// @TODO - this is duplicating items menu, now that we added the extraChildren option we
// should be able to just implement item state with a list of dummy consumables
// - also, we copied this to SelectingBookType menu as well so if we ever change this, look at that too
export class PurchaseItemsMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages: number = 1;
  type = MenuStateType.PurchasingItems;
  alwaysShowPageOne = false;
  getCenterInfoDisplayOption = null;
  constructor() {}

  getButtonProperties(): ActionButtonsByCategory {
    const { focusStore } = AppStore.get();
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

    toReturn[ActionButtonCategory.Top].push(
      createCancelButton([], () => {
        focusStore.clearDetailable();
      })
    );
    toReturn[ActionButtonCategory.Top].push(setInventoryOpen);

    const purchaseableItems = [ConsumableType.HpAutoinjector, ConsumableType.MpAutoinjector];
    for (const consumableType of purchaseableItems) {
      const price = getConsumableShardPrice(
        partyResult.dungeonExplorationManager.getCurrentFloor(),
        consumableType
      );

      const thumbnailId = CONSUMABLE_TYPE_STRINGS[consumableType];
      const thumbnailOption = useGameStore.getState().itemThumbnails[thumbnailId];

      const purchaseItemButton = new ActionMenuButtonProperties(
        () => (
          <ItemButtonBody
            gradientOverride={consumableGradientBg}
            thumbnailOption={thumbnailOption}
            containerExtraStyles={CONSUMABLE_TEXT_COLOR}
            imageExtraStyles="scale-[300%]"
            imageHoverStyles="-translate-x-[55px]"
          >
            <div
              className="h-full flex justify-between items-center w-full pr-2"
              onMouseEnter={() => {
                focusStore.setHovered(createDummyConsumable(consumableType));
              }}
              onMouseLeave={() => {
                focusStore.clearHovered();
              }}
            >
              <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
                {CONSUMABLE_TYPE_STRINGS[consumableType]}
              </div>
              <PriceDisplay
                price={price}
                shardsOwned={focusedCharacterResult.combatantProperties.inventory.shards}
              />
            </div>
          </ItemButtonBody>
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
        focusedCharacterResult.combatantProperties.inventory.shards < (price || 0);
      toReturn[ActionButtonCategory.Numbered].push(purchaseItemButton);
    }

    createPageButtons(this, toReturn);

    return toReturn;
  }
}
