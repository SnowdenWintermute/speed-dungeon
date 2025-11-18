import { ActionMenuState } from ".";
import {
  BookConsumableType,
  Consumable,
  SKILL_BOOK_CONSUMABLE_TYPES,
  createDummyConsumable,
} from "@speed-dungeon/common";
import { SelectItemToTradeForBookMenuState } from "./select-item-to-trade-for-book";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import GoBackButton from "./common-buttons/GoBackButton";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";
import { ItemButton } from "./common-buttons/ItemButton";
import makeAutoObservable from "mobx-store-inheritance";

export const SKILL_BOOK_SHOP_LIST = SKILL_BOOK_CONSUMABLE_TYPES.map((consumableType) =>
  createDummyConsumable(consumableType)
).filter(isBookConsumable);

function isBookConsumable(c: Consumable): c is Consumable & { consumableType: BookConsumableType } {
  return SKILL_BOOK_CONSUMABLE_TYPES.includes(c.consumableType as BookConsumableType);
}

export class SelectBookToTradeForMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.SelectingBookType);
    makeAutoObservable(this);
  }

  getTopSection() {
    return (
      <ul className="flex">
        <GoBackButton
          extraFn={() => {
            AppStore.get().focusStore.detailables.clear();
          }}
        />
        <ToggleInventoryButton />
      </ul>
    );
  }

  getNumberedButtons() {
    const { gameStore } = AppStore.get();

    const userControlsThisCharacter = gameStore.clientUserControlsFocusedCombatant();

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
            AppStore.get().actionMenuStore.pushStack(
              new SelectItemToTradeForBookMenuState(book.consumableType)
            );
          }}
          disabled={shouldBeDisabled}
        />
      );
    });
  }
}
