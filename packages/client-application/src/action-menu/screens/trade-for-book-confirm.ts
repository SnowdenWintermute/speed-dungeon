import {
  BookConsumableType,
  ClientIntentType,
  Item,
  getBookLevelForTrade,
} from "@speed-dungeon/common";
import { ClientApplication } from "../../";
import { ActionMenuScreenType } from "../screen-types";
import { ActionMenuScreen } from ".";
import { HotkeyButtonTypes } from "../../ui/keybind-config";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuCentralSection,
  ActionMenuCentralSectionType,
} from "../action-menu-display-data";

function handleConfirmTrade(
  clientApplication: ClientApplication,
  item: Item,
  bookType: BookConsumableType
) {
  const characterId = clientApplication.combatantFocus.requireFocusedCharacterId();
  const itemId = item.getEntityId();
  clientApplication.gameClientRef.get().dispatchIntent({
    type: ClientIntentType.TradeItemForBook,
    data: { characterId, itemId, bookType },
  });
  clientApplication.actionMenu.popStack();
  clientApplication.actionMenu.popStack();
  clientApplication.detailableEntityFocus.clearItemComparison();
}

export class ConfirmTradeForBookActionMenuScreen extends ActionMenuScreen {
  constructor(
    clientApplication: ClientApplication,
    public item: Item,
    public bookType: BookConsumableType
  ) {
    super(clientApplication, ActionMenuScreenType.ConfirmTradeForBook);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    const { combatantFocus, uiStore } = this.clientApplication;
    const userControlsThisCharacter = combatantFocus.clientUserControlsFocusedCombatant();
    const buttonType = HotkeyButtonTypes.Confirm;

    return [
      {
        type: ActionMenuTopSectionItemType.GoBack,
        data: {
          extraFn: () => {
            this.clientApplication.detailableEntityFocus.detailables.clear();
          },
        },
      },
      {
        type: ActionMenuTopSectionItemType.ConfirmTradeForBook,
        data: {
          hotkeys: uiStore.keybinds.getKeybind(buttonType),
          hotkeyString: uiStore.keybinds.getKeybindString(buttonType),
          disabled: !userControlsThisCharacter,
          onClick: () => handleConfirmTrade(this.clientApplication, this.item, this.bookType),
        },
      },
    ];
  }

  getCentralSection(): ActionMenuCentralSection {
    const party = this.clientApplication.gameContext.requireParty();
    const vendingMachineLevel = party.dungeonExplorationManager.getCurrentFloor();
    const bookLevel = getBookLevelForTrade(this.item.itemLevel, vendingMachineLevel);

    return {
      type: ActionMenuCentralSectionType.TradeForBookConfirmation,
      data: {
        item: this.item,
        bookType: this.bookType,
        onClick: () => handleConfirmTrade(this.clientApplication, this.item, this.bookType),
      },
    };
  }
}
