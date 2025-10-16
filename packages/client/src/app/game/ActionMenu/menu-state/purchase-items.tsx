import { ActionMenuState } from ".";
import { createPageButtons } from "./create-page-buttons";
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
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory, ActionButtonsByCategory } from "./action-buttons-by-category";

// @TODO - this is duplicating items menu, now that we added the extraChildren option we
// should be able to just implement item state with a list of dummy consumables
// - also, we copied this to SelectingBookType menu as well so if we ever change this, look at that too
export class PurchaseItemsMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.PurchasingItems, 1);
  }

  getButtonProperties(): ActionButtonsByCategory {
    const { focusStore, gameStore } = AppStore.get();
    const toReturn = new ActionButtonsByCategory();

    const focusedCharacter = gameStore.getExpectedFocusedCharacter();
    const party = gameStore.getExpectedParty();

    const userControlsThisCharacter = gameStore.clientUserControlsFocusedCombatant();

    toReturn[ActionButtonCategory.Top].push(
      createCancelButton([], () => {
        focusStore.detailable.clear();
      })
    );
    toReturn[ActionButtonCategory.Top].push(setInventoryOpen);

    const purchaseableItems = [ConsumableType.HpAutoinjector, ConsumableType.MpAutoinjector];
    for (const consumableType of purchaseableItems) {
      const price = getConsumableShardPrice(
        party.dungeonExplorationManager.getCurrentFloor(),
        consumableType
      );

      const thumbnailId = CONSUMABLE_TYPE_STRINGS[consumableType];
      const thumbnailOption = AppStore.get().imageStore.getItemThumbnailOption(thumbnailId);

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
                focusStore.detailable.setHovered(createDummyConsumable(consumableType));
              }}
              onMouseLeave={() => {
                focusStore.detailable.clearHovered();
              }}
            >
              <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
                {CONSUMABLE_TYPE_STRINGS[consumableType]}
              </div>
              <PriceDisplay
                price={price}
                shardsOwned={focusedCharacter.combatantProperties.inventory.shards}
              />
            </div>
          </ItemButtonBody>
        ),
        `${CONSUMABLE_TYPE_STRINGS[consumableType]} (${price} shards)`,
        () => {
          websocketConnection.emit(ClientToServerEvent.PurchaseItem, {
            characterId: focusedCharacter.getEntityId(),
            consumableType,
          });
        }
      );

      const notEnoughShards = focusedCharacter.combatantProperties.inventory.shards < (price || 0);

      purchaseItemButton.shouldBeDisabled = !userControlsThisCharacter || notEnoughShards;

      toReturn[ActionButtonCategory.Numbered].push(purchaseItemButton);
    }

    createPageButtons(toReturn);

    return toReturn;
  }
}
