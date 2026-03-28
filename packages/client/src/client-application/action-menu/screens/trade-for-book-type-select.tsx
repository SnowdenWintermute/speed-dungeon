import { ClientApplication } from "@/client-application";
import { ActionMenuScreen } from ".";
import {
  BookConsumableType,
  Consumable,
  SKILL_BOOK_CONSUMABLE_TYPES,
  createDummyConsumable,
} from "@speed-dungeon/common";
import makeAutoObservable from "mobx-store-inheritance";
import { ActionMenuScreenType } from "../screen-types";
import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";
import ToggleInventoryButton from "@/app/game/ActionMenu/menu-state/common-buttons/ToggleInventory";
import { ItemButton } from "@/app/game/ActionMenu/menu-state/common-buttons/ItemButton";
import { SelectItemToTradeForBookActionMenuScreen } from "./trade-for-book-item-select";

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

  getTopSection() {
    return (
      <ul className="flex">
        <GoBackButton
          extraFn={() => {
            this.clientApplication.detailableEntityFocus.detailables.clear();
          }}
        />
        <ToggleInventoryButton />
      </ul>
    );
  }

  getNumberedButtons() {
    const userControlsThisCharacter =
      this.clientApplication.combatantFocus.clientUserControlsFocusedCombatant();

    // let them select and then if they don't have the items to trade, explain what is required
    const shouldBeDisabled = !userControlsThisCharacter;

    return SKILL_BOOK_SHOP_LIST.map((book, i) => {
      const buttonNumber = i + 1;
      return (
        <ItemButton
          key={book.consumableType}
          item={book}
          text={book.entityProperties.name}
          hotkeyLabel={`${buttonNumber}`}
          hotkeys={[`Digit${buttonNumber}`]}
          clickHandler={() => {
            this.clientApplication.actionMenu.pushStack(
              new SelectItemToTradeForBookActionMenuScreen(
                this.clientApplication,
                book.consumableType
              )
            );
          }}
          disabled={shouldBeDisabled}
        />
      );
    });
  }
}
