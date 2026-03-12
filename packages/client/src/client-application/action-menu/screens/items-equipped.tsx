import { Item } from "@speed-dungeon/common";
import { ConsideringItemActionMenuScreen } from "./considering-item";
import { ActionMenuScreen } from ".";
import makeAutoObservable from "mobx-store-inheritance";
import { ClientApplication } from "../..";
import { ActionMenuScreenType } from "../screen-types";
import { HotkeyButtonTypes } from "@/client-application/inputs/keybind-config";
import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";

export class EquippedItemsActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.ViewingEquipedItems);
    makeAutoObservable(this);
  }

  getTopSection() {
    const viewEquipmentHotkeys = this.clientApplication.keybindConfig.getKeybind(
      HotkeyButtonTypes.ToggleViewEquipment
    );
    return (
      <ul className="flex">
        <GoBackButton extraHotkeys={viewEquipmentHotkeys} />
      </ul>
    );
  }

  getNumberedButtons() {
    const focusedCharacter = this.clientApplication.combatantFocus.requireFocusedCharacter();
    const itemsInInventory = focusedCharacter.combatantProperties.equipment.getAllEquippedItems({
      includeUnselectedHotswapSlots: false,
    });
    const { detailableEntityFocus, actionMenu } = this.clientApplication;
    const clientApplication = this.clientApplication;

    function itemButtonClickHandler(item: Item) {
      detailableEntityFocus.selectItem(item);
      actionMenu.pushStack(new ConsideringItemActionMenuScreen(clientApplication, item));
    }

    const newNumberedButtons = ActionMenuScreen.getItemButtonsFromList(
      itemsInInventory,
      itemButtonClickHandler,
      () => false
    );

    return newNumberedButtons;
  }
}
