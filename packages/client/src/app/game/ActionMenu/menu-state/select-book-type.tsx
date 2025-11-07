import { ActionMenuState } from ".";
import {
  CONSUMABLE_TEXT_COLOR,
  CONSUMABLE_TYPE_STRINGS,
  SKILL_BOOK_CONSUMABLE_TYPES,
  createDummyConsumable,
} from "@speed-dungeon/common";
import { ItemButtonBody, consumableGradientBg } from "./items";
import { setInventoryOpen } from "./common-buttons/open-inventory";
import { createCancelButton } from "./common-buttons/cancel";
import { IconName, SVG_ICONS } from "@/app/icons";
import { SelectItemToTradeForBookMenuState } from "./select-item-to-trade-for-book";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory, ActionButtonsByCategory } from "./action-buttons-by-category";

export class SelectBookToTradeForMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.SelectingBookType, 1);
  }

  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();
    const { focusStore, gameStore } = AppStore.get();

    const userControlsThisCharacter = gameStore.clientUserControlsFocusedCombatant();

    toReturn[ActionButtonCategory.Top].push(
      createCancelButton([], () => {
        focusStore.detailables.clear();
      })
    );
    toReturn[ActionButtonCategory.Top].push(setInventoryOpen);

    for (const consumableType of SKILL_BOOK_CONSUMABLE_TYPES) {
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
                focusStore.detailables.setHovered(createDummyConsumable(consumableType));
              }}
              onMouseLeave={() => {
                focusStore.detailables.clearHovered();
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
          AppStore.get().actionMenuStore.pushStack(
            new SelectItemToTradeForBookMenuState(consumableType)
          );
        }
      );

      // let them select and then if they don't have the items to trade, explain what is required
      purchaseItemButton.shouldBeDisabled = !userControlsThisCharacter;

      toReturn[ActionButtonCategory.Numbered].push(purchaseItemButton);
    }

    createPageButtons(toReturn);

    return toReturn;
  }
}
