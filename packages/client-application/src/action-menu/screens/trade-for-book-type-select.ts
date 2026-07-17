import { ClientApplication } from "../../";
import { getActionMenuSlotHotkeys, getActionMenuSlotLabel } from "../slot-keybinds";
import { ActionMenuScreen } from ".";
import {
  BookConsumableType,
  Consumable,
  SKILL_BOOK_CONSUMABLE_TYPES,
  createDummyConsumable,
} from "@speed-dungeon/common";
import makeAutoObservable from "mobx-store-inheritance";
import { ActionMenuScreenType } from "../screen-types";
import { SelectItemToTradeForBookActionMenuScreen } from "./trade-for-book-item-select";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuNumberedButtonDescriptor,
  ActionMenuNumberedButtonType,
} from "../action-menu-display-data";

export const SKILL_BOOK_SHOP_LIST = SKILL_BOOK_CONSUMABLE_TYPES.map((consumableType) =>
  createDummyConsumable(consumableType)
).filter(isBookConsumable);

function isBookConsumable(c: Consumable): c is Consumable & { consumableType: BookConsumableType } {
  return SKILL_BOOK_CONSUMABLE_TYPES.includes(c.consumableType as BookConsumableType);
}

export class SelectBookToTradeForActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.SelectingBookType);
    makeAutoObservable(this);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    return [
      {
        type: ActionMenuTopSectionItemType.GoBack,
        data: {
          extraFn: () => {
            this.clientApplication.detailableEntityFocus.detailables.clear();
          },
        },
      },
      { type: ActionMenuTopSectionItemType.ToggleInventory, data: undefined },
    ];
  }

  getNumberedButtons(): ActionMenuNumberedButtonDescriptor[] {
    const userControlsThisCharacter =
      this.clientApplication.combatantFocus.clientUserControlsFocusedCombatant();
    const disabled = !userControlsThisCharacter;

    const keybinds = this.clientApplication.uiStore.keybinds;
    return SKILL_BOOK_SHOP_LIST.map((book, i) => {
      const buttonNumber = i + 1;
      return {
        type: ActionMenuNumberedButtonType.Item as const,
        data: {
          item: book,
          text: book.entityProperties.name,
          hotkeyLabel: getActionMenuSlotLabel(keybinds, buttonNumber),
          hotkeys: getActionMenuSlotHotkeys(keybinds, buttonNumber),
          onClick: () => {
            this.clientApplication.actionMenu.pushStack(
              new SelectItemToTradeForBookActionMenuScreen(
                this.clientApplication,
                book.consumableType
              )
            );
          },
          disabled,
        },
      };
    });
  }
}
