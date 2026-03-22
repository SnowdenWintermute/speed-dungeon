import { Item } from "@speed-dungeon/common";
import { ConsideringItemActionMenuScreen } from "./considering-item";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ActionMenuScreenType } from "./menu-state-type";
import { ReactNode } from "react";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import GoBackButton from "./common-buttons/GoBackButton";
import { ActionMenuScreen } from ".";
import makeAutoObservable from "mobx-store-inheritance";

export class EquippedItemsActionMenuScreen extends ActionMenuScreen {
  constructor() {
    super(ActionMenuScreenType.ViewingEquipedItems);
    makeAutoObservable(this);
  }

  getTopSection(): ReactNode {
    const viewEquipmentHotkeys = AppStore.get().hotkeysStore.getKeybind(
      HotkeyButtonTypes.ToggleViewEquipment
    );
    return (
      <ul className="flex">
        <GoBackButton extraHotkeys={viewEquipmentHotkeys} />
      </ul>
    );
  }

  getNumberedButtons() {
    const focusedCharacter = clientApplication.combatantFocus.requireFocusedCharacter();
    const itemsInInventory = focusedCharacter.combatantProperties.equipment.getAllEquippedItems({
      includeUnselectedHotswapSlots: false,
    });

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
