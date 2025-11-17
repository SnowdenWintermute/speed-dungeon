import { ItemsMenuState } from "./items";
import {
  BookConsumableType,
  ConsumableType,
  Item,
  getOwnedAcceptedItemsForBookTrade,
} from "@speed-dungeon/common";
import { ReactNode } from "react";
import { ConfirmTradeForBookMenuState } from "./confirm-trade-for-book";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory } from "./action-buttons-by-category";
import { ActionMenuState } from ".";
import GoBackButton from "./common-buttons/GoBackButton";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";

export class SelectItemToTradeForBookMenuState extends ActionMenuState {
  acceptedItems: Item[] = [];
  constructor(public bookType: BookConsumableType) {
    super(
      MenuStateType.SelectItemToTradeForBook,
      { text: "Go Back", hotkeys: [] },
      (item: Item) => {
        AppStore.get().focusStore.selectItem(item);
        AppStore.get().actionMenuStore.pushStack(
          new ConfirmTradeForBookMenuState(item, this.bookType)
        );
      },
      () => Object.values(this.acceptedItems)
    );

    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
    const { combatantProperties } = focusedCharacter;

    this.acceptedItems = getOwnedAcceptedItemsForBookTrade(combatantProperties, this.bookType);

    if (this.acceptedItems.length < 1)
      this.getCenterInfoDisplayOption = () => {
        return (
          <div className="h-full bg-slate-700 p-2 border border-t-0 border-slate-400">
            <p className="mb-1"> No items in your possession are accepted for this trade.</p>
            <p className="mb-1">
              This trade requires {BOOK_TRADE_ACCEPTED_EQUIPMENT_DESCRIPTIONS[this.bookType]}.
            </p>
            <p>
              {" "}
              Items must be <span className={"font-bold"}>completely broken</span>.
            </p>
          </div>
        );
      };
  }

  getTopSection() {
    return (
      <ul className="flex">
        <GoBackButton />
        <ToggleInventoryButton />
      </ul>
    );
  }
}

export const BOOK_TRADE_ACCEPTED_EQUIPMENT_DESCRIPTIONS: Record<BookConsumableType, ReactNode> = {
  [ConsumableType.WarriorSkillbook]: (
    <span>
      a <span className={"font-bold"}>one handed melee weapon with the strength attribute</span>
    </span>
  ),
  [ConsumableType.RogueSkillbook]: (
    <span>
      a{" "}
      <span className={"font-bold"}>
        {" "}
        one handed slashing melee weapon with the dexterity or accuracy attribute
      </span>{" "}
      OR a{" "}
      <span className={"font-bold"}> bow with the dexterity, accuracy or evasion attribute</span>
    </span>
  ),
  [ConsumableType.MageSkillbook]: (
    <span>
      a <span className={"font-bold"}> wand or a staff with the intelligence attribute</span>
    </span>
  ),
};
