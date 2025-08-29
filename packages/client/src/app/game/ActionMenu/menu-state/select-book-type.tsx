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
import clientUserControlsCombatant from "@/utils/client-user-controls-combatant";
import {
  BookConsumableType,
  CONSUMABLE_TEXT_COLOR,
  CONSUMABLE_TYPE_STRINGS,
  ClientToServerEvent,
  ConsumableType,
  SKILL_BOOK_CONSUMABLE_TYPES,
  createDummyConsumable,
  getConsumableShardPrice,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { ItemButtonBody, consumableGradientBg } from "./items";
import { setInventoryOpen } from "./common-buttons/open-inventory";
import { createCancelButton } from "./common-buttons/cancel";
import setItemHovered from "@/utils/set-item-hovered";
import { PriceDisplay } from "../../character-sheet/ShardsDisplay";
import { IconName, SVG_ICONS } from "@/app/icons";
import { SelectItemToTradeForBookMenuState } from "./select-item-to-trade-for-book";
import { ReactNode } from "react";

export class SelectBookToTradeForMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages: number = 1;
  type = MenuStateType.SelectingBookType;
  alwaysShowPageOne = false;
  getCenterInfoDisplayOption = null;
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

    toReturn[ActionButtonCategory.Top].push(
      createCancelButton([], () => {
        useGameStore.getState().mutateState((state) => {
          state.hoveredEntity = null;
          state.detailedEntity = null;
        });
      })
    );
    toReturn[ActionButtonCategory.Top].push(setInventoryOpen);

    for (const consumableType of SKILL_BOOK_CONSUMABLE_TYPES) {
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
                setItemHovered(createDummyConsumable(consumableType));
              }}
              onMouseLeave={() => {
                setItemHovered(null);
              }}
            >
              <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
                {CONSUMABLE_TYPE_STRINGS[consumableType]}
              </div>
              <div className="h-full">{SVG_ICONS[IconName.Book]("h-full fill-slate-400")}</div>
            </div>
          </ItemButtonBody>
        ),
        `${CONSUMABLE_TYPE_STRINGS[consumableType]}`,
        () => {
          useGameStore.getState().mutateState((state) => {
            state.stackedMenuStates.push(new SelectItemToTradeForBookMenuState(consumableType));
          });
        }
      );

      // let them select and then if they don't have the items to trade, explain what is required
      purchaseItemButton.shouldBeDisabled = false;

      toReturn[ActionButtonCategory.Numbered].push(purchaseItemButton);
    }

    createPageButtons(this, toReturn);

    return toReturn;
  }
}
