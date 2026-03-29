import { ERROR_MESSAGES, Equipment, Item } from "@speed-dungeon/common";
import { ActionMenuScreen } from ".";
import makeAutoObservable from "mobx-store-inheritance";
import { ActionMenuScreenType } from "../screen-types";
import { ClientApplication } from "../../";
import { CraftingItemActionMenuScreen } from "./crafting-item";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuNumberedButtonDescriptor,
} from "../action-menu-display-data";

export class CraftingItemSelectionActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.CraftingItemSelection);
    makeAutoObservable(this);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    return [
      { type: ActionMenuTopSectionItemType.GoBack, data: {} },
      { type: ActionMenuTopSectionItemType.ToggleInventory, data: undefined },
      { type: ActionMenuTopSectionItemType.VendingMachineShards, data: undefined },
    ];
  }

  getNumberedButtons(): ActionMenuNumberedButtonDescriptor[] {
    const focusedCharacter = this.clientApplication.combatantFocus.requireFocusedCharacter();
    const ownedEquipment = focusedCharacter.combatantProperties.inventory.getOwnedEquipment();
    const { detailableEntityFocus, actionMenu, alertsService } = this.clientApplication;
    const clientApplication = this.clientApplication;

    function clickHandler(item: Item) {
      detailableEntityFocus.selectItem(item);
      if (!(item instanceof Equipment)) {
        alertsService.setAlert(ERROR_MESSAGES.ITEM.INVALID_TYPE);
        return;
      }
      actionMenu.pushStack(new CraftingItemActionMenuScreen(clientApplication, item));
    }

    return ActionMenuScreen.getItemButtonsFromList(ownedEquipment, clickHandler, () => false);
  }
}
