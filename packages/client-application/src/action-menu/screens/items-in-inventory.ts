import { Item } from "@speed-dungeon/common";
import { ActionMenuScreen } from ".";
import { ConsideringItemActionMenuScreen } from "./considering-item";
import makeAutoObservable from "mobx-store-inheritance";
import { ClientApplication } from "../../";
import { ActionMenuScreenType } from "../screen-types";
import { HotkeyButtonTypes } from "../../ui/keybind-config";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuNumberedButtonDescriptor,
} from "../action-menu-display-data";

export class InventoryItemsActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.InventoryItems);
    makeAutoObservable(this);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    const extraHotkeys = this.clientApplication.uiStore.keybinds.getKeybind(
      HotkeyButtonTypes.ToggleInventory
    );
    return [
      { type: ActionMenuTopSectionItemType.GoBack, data: { extraHotkeys } },
      { type: ActionMenuTopSectionItemType.ToggleViewEquipment, data: undefined },
      { type: ActionMenuTopSectionItemType.ViewAbilityTree, data: undefined },
    ];
  }

  getNumberedButtons(): ActionMenuNumberedButtonDescriptor[] {
    const clientApplication = this.clientApplication;
    const { combatantFocus, detailableEntityFocus, actionMenu } = clientApplication;
    const focusedCharacter = combatantFocus.requireFocusedCharacter();
    const itemsInInventory = focusedCharacter.combatantProperties.inventory.getItems();

    function itemButtonClickHandler(item: Item) {
      detailableEntityFocus.selectItem(item);
      actionMenu.pushStack(new ConsideringItemActionMenuScreen(clientApplication, item));
    }

    return ActionMenuScreen.getItemButtonsFromList(itemsInInventory, itemButtonClickHandler, () => false);
  }
}
