import { Item } from "@speed-dungeon/common";
import { ConsideringItemMenuState } from "./considering-item";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import { ReactNode } from "react";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";
import GoBackButton from "./common-buttons/GoBackButton";
import { ActionMenuState } from ".";
import makeAutoObservable from "mobx-store-inheritance";

export class EquippedItemsMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.ViewingEquipedItems);
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
    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
    const itemsInInventory = focusedCharacter.combatantProperties.equipment.getAllEquippedItems({
      includeUnselectedHotswapSlots: false,
    });

    function itemButtonClickHandler(item: Item) {
      AppStore.get().focusStore.selectItem(item);
      AppStore.get().actionMenuStore.pushStack(new ConsideringItemMenuState(item));
    }

    const newNumberedButtons = ActionMenuState.getItemButtonsFromList(
      itemsInInventory,
      itemButtonClickHandler,
      () => false
    );

    return newNumberedButtons;
  }
}
