import { ClientIntentType } from "@speed-dungeon/common";
import { ActionMenuScreen } from ".";
import makeAutoObservable from "mobx-store-inheritance";
import { ClientApplication } from "../../";
import { ActionMenuScreenType } from "../screen-types";
import { HotkeyButtonTypes } from "../../ui/keybind-config";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuNumberedButtonDescriptor,
} from "../action-menu-display-data";

export class ItemsOnGroundActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.ItemsOnGround);
    makeAutoObservable(this);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    const { combatantFocus, uiStore } = this.clientApplication;
    const { keybinds } = uiStore;
    const buttonType = HotkeyButtonTypes.TakeAllItems;
    const ownsFocusedCharacter = combatantFocus.clientUserControlsFocusedCombatant({ includePets: true });

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
      {
        type: ActionMenuTopSectionItemType.TakeAllItemsFromGround,
        data: {
          hotkeys: keybinds.getKeybind(buttonType),
          hotkeyString: keybinds.getKeybindString(buttonType),
          disabled: !ownsFocusedCharacter,
          onClick: () => {
            const focusedCharacterId = this.clientApplication.combatantFocus.requireFocusedCharacterId();
            const party = this.clientApplication.gameContext.requireParty();
            const itemIds = party.currentRoom.inventory.getItems().map((item) => item.entityProperties.id);
            this.clientApplication.gameClientRef.get().dispatchIntent({
              type: ClientIntentType.PickUpItems,
              data: { characterId: focusedCharacterId, itemIds },
            });
            this.clientApplication.actionMenu.popStack();
          },
        },
      },
    ];
  }

  getNumberedButtons(): ActionMenuNumberedButtonDescriptor[] {
    const party = this.clientApplication.gameContext.requireParty();
    const itemsOnGround = party.currentRoom.inventory.getItems();
    const ownsFocusedCharacter = this.clientApplication.combatantFocus.clientUserControlsFocusedCombatant({ includePets: true });

    return ActionMenuScreen.getItemButtonsFromList(
      itemsOnGround,
      (item) => {
        this.clientApplication.detailableEntityFocus.detailables.clear();
        this.clientApplication.gameClientRef.get().dispatchIntent({
          type: ClientIntentType.PickUpItems,
          data: {
            characterId: this.clientApplication.combatantFocus.requireFocusedCharacterId(),
            itemIds: [item.entityProperties.id],
          },
        });
      },
      () => !ownsFocusedCharacter
    );
  }
}
