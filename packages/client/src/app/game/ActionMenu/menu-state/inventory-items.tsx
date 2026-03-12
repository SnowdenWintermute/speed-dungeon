import { Item } from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuScreenType } from "./menu-state-type";
import { ActionMenuScreen } from ".";
import { ReactNode } from "react";
import { ConsideringItemActionMenuScreen } from "./considering-item";
import GoBackButton from "./common-buttons/GoBackButton";
import ViewAbilityTreeButton from "./common-buttons/ViewAbilityTreeButton";
import makeAutoObservable from "mobx-store-inheritance";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import ToggleViewingEquipmentButton from "./common-buttons/ToggleViewingEquipmentButton";

export class InventoryItemsActionMenuScreen extends ActionMenuScreen {
  constructor() {
    super(ActionMenuScreenType.InventoryItems);
    makeAutoObservable(this);
  }

  getTopSection(): ReactNode {
    const { hotkeysStore } = AppStore.get();
    const toggleInventoryHotkeys = hotkeysStore.getKeybind(HotkeyButtonTypes.ToggleInventory);

    return (
      <ul className="flex">
        <GoBackButton extraHotkeys={toggleInventoryHotkeys} />
        <ToggleViewingEquipmentButton />
        <ViewAbilityTreeButton />
      </ul>
    );
  }

  getNumberedButtons() {
    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
    const itemsInInventory = focusedCharacter.combatantProperties.inventory.getItems();

    function itemButtonClickHandler(item: Item) {
      AppStore.get().focusStore.selectItem(item);
      AppStore.get().actionMenuStore.pushStack(new ConsideringItemActionMenuScreen(item));
    }

    const newNumberedButtons = ActionMenuScreen.getItemButtonsFromList(
      itemsInInventory,
      itemButtonClickHandler,
      () => false
    );

    return newNumberedButtons;
  }
}
