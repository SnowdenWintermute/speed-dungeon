import { Item } from "@speed-dungeon/common";
import { ConsideringItemActionMenuScreen } from "./considering-item";
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

export class EquippedItemsActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.ViewingEquipedItems);
    makeAutoObservable(this);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    const extraHotkeys = this.clientApplication.uiStore.keybinds.getKeybind(
      HotkeyButtonTypes.ToggleViewEquipment
    );
    return [{ type: ActionMenuTopSectionItemType.GoBack, data: { extraHotkeys } }];
  }

  getNumberedButtons(): ActionMenuNumberedButtonDescriptor[] {
    const focusedCharacter = this.clientApplication.combatantFocus.requireFocusedCharacter();
    const itemsEquipped = focusedCharacter.combatantProperties.equipment.getAllEquippedItems({
      includeUnselectedHotswapSlots: false,
    });
    const { detailableEntityFocus, actionMenu } = this.clientApplication;
    const clientApplication = this.clientApplication;

    function itemButtonClickHandler(item: Item) {
      detailableEntityFocus.selectItem(item);
      actionMenu.pushStack(new ConsideringItemActionMenuScreen(clientApplication, item));
    }

    return ActionMenuScreen.getItemButtonsFromList(itemsEquipped, itemButtonClickHandler, () => false);
  }
}
