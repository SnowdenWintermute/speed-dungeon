import {
  BookConsumableType,
  ConsumableType,
  getOwnedAcceptedItemsForBookTrade,
} from "@speed-dungeon/common";
import { ReactNode } from "react";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import { ActionMenuState } from ".";
import GoBackButton from "./common-buttons/GoBackButton";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";
import makeAutoObservable from "mobx-store-inheritance";
import { ItemButton } from "./common-buttons/ItemButton";
import { ConfirmTradeForBookMenuState } from "./confirm-trade-for-book";

export class SelectItemToTradeForBookMenuState extends ActionMenuState {
  constructor(public bookType: BookConsumableType) {
    super(MenuStateType.SelectItemToTradeForBook);
    makeAutoObservable(this);
  }

  getTopSection() {
    return (
      <ul className="flex">
        <GoBackButton />
        <ToggleInventoryButton />
      </ul>
    );
  }

  getNumberedButtons() {
    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
    const { combatantProperties } = focusedCharacter;

    return getOwnedAcceptedItemsForBookTrade(combatantProperties, this.bookType).map((item, i) => {
      const buttonNumber = i + 1;
      return (
        <ItemButton
          key={item.entityProperties.id}
          item={item}
          text={item.entityProperties.name}
          hotkeyLabel={`${buttonNumber}`}
          hotkeys={[`Digit${buttonNumber}`]}
          clickHandler={() => {
            AppStore.get().focusStore.selectItem(item);
            AppStore.get().actionMenuStore.pushStack(
              new ConfirmTradeForBookMenuState(item, this.bookType)
            );
          }}
          disabled={false}
        />
      );
    });
  }

  getCentralSection() {
    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
    const { combatantProperties } = focusedCharacter;

    const acceptedItems = getOwnedAcceptedItemsForBookTrade(combatantProperties, this.bookType);

    if (acceptedItems.length >= 1) return <div />;

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
