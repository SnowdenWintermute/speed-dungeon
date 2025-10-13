import { useGameStore } from "@/stores/game-store";
import { ActionButtonCategory, ActionButtonsByCategory, ActionMenuState, MenuStateType } from ".";
import { setAlert } from "@/app/components/alerts";
import { createPageButtons } from "./create-page-buttons";
import { clientUserControlsCombatant } from "@/utils/client-user-controls-combatant";
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

export class SelectBookToTradeForMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.SelectingBookType, 1);
  }

  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();
    const { focusStore } = AppStore.get();

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
        focusStore.detailable.clear();
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
                focusStore.detailable.setHovered(createDummyConsumable(consumableType));
              }}
              onMouseLeave={() => {
                focusStore.detailable.clearHovered();
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
