import { Item } from "@speed-dungeon/common";
import { ActionMenuScreen } from ".";
import { ConsideringItemActionMenuScreen } from "./considering-item";
import makeAutoObservable from "mobx-store-inheritance";
import { ClientApplication } from "../..";
import { ActionMenuScreenType } from "../screen-types";
import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";
import { ToggleViewingEquipmentButton } from "@/app/game/ActionMenu/menu-state/common-buttons/ToggleViewingEquipmentButton";
import { ViewAbilityTreeButton } from "@/app/game/ActionMenu/menu-state/common-buttons/ViewAbilityTreeButton";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";

export class InventoryItemsActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.InventoryItems);
    makeAutoObservable(this);
  }

  getTopSection() {
    const toggleInventoryHotkeys = this.clientApplication.uiStore.keybinds.getKeybind(
      HotkeyButtonTypes.ToggleInventory
    );

    return (
      <ul className="flex">
        <GoBackButton extraHotkeys={toggleInventoryHotkeys} />
        <ToggleViewingEquipmentButton />
        <ViewAbilityTreeButton />
      </ul>
    );
  }

  getNumberedButtons() {
    const clientApplication = this.clientApplication;
    const { combatantFocus, detailableEntityFocus, actionMenu } = clientApplication;
    const focusedCharacter = combatantFocus.requireFocusedCharacter();
    const itemsInInventory = focusedCharacter.combatantProperties.inventory.getItems();

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
