import {
  BookConsumableType,
  getOwnedAcceptedItemsForBookTrade,
} from "@speed-dungeon/common";
import { ActionMenuScreen } from ".";
import makeAutoObservable from "mobx-store-inheritance";
import { ClientApplication } from "../../";
import { ActionMenuScreenType } from "../screen-types";
import { ConfirmTradeForBookActionMenuScreen } from "./trade-for-book-confirm";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuNumberedButtonDescriptor,
  ActionMenuNumberedButtonType,
  ActionMenuCentralSection,
  ActionMenuCentralSectionType,
} from "../action-menu-display-data";

export class SelectItemToTradeForBookActionMenuScreen extends ActionMenuScreen {
  constructor(
    clientApplication: ClientApplication,
    public bookType: BookConsumableType
  ) {
    super(clientApplication, ActionMenuScreenType.SelectItemToTradeForBook);
    makeAutoObservable(this);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    return [
      { type: ActionMenuTopSectionItemType.GoBack, data: {} },
      { type: ActionMenuTopSectionItemType.ToggleInventory, data: undefined },
    ];
  }

  getNumberedButtons(): ActionMenuNumberedButtonDescriptor[] {
    const focusedCharacter = this.clientApplication.combatantFocus.requireFocusedCharacter();
    const { combatantProperties } = focusedCharacter;

    return getOwnedAcceptedItemsForBookTrade(combatantProperties, this.bookType).map((item, i) => {
      const buttonNumber = i + 1;
      return {
        type: ActionMenuNumberedButtonType.Item as const,
        data: {
          item,
          text: item.entityProperties.name,
          hotkeyLabel: `${buttonNumber}`,
          hotkeys: [`Digit${buttonNumber}`],
          onClick: () => {
            this.clientApplication.detailableEntityFocus.selectItem(item);
            this.clientApplication.actionMenu.pushStack(
              new ConfirmTradeForBookActionMenuScreen(this.clientApplication, item, this.bookType)
            );
          },
          disabled: false,
        },
      };
    });
  }

  getCentralSection(): ActionMenuCentralSection | null {
    const focusedCharacter = this.clientApplication.combatantFocus.requireFocusedCharacter();
    const { combatantProperties } = focusedCharacter;
    const acceptedItems = getOwnedAcceptedItemsForBookTrade(combatantProperties, this.bookType);

    if (acceptedItems.length >= 1) return null;

    return {
      type: ActionMenuCentralSectionType.TradeForBookRequirements,
      data: { bookType: this.bookType },
    };
  }
}
