import { Item } from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { ActionMenuState } from ".";
import { ReactNode } from "react";
import { ConsideringItemMenuState } from "./considering-item";
import GoBackButton from "./common-buttons/GoBackButton";
import ActionMenuTopButton from "./common-buttons/ActionMenuTopButton";
import ViewAbilityTreeButton from "./common-buttons/ViewAbilityTreeButton";
import makeAutoObservable from "mobx-store-inheritance";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";

export class InventoryItemsMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.InventoryItems);
    makeAutoObservable(this);
  }

  getTopSection(): ReactNode {
    const { hotkeysStore } = AppStore.get();
    const viewEquipmentHotkeys = hotkeysStore.getKeybind(HotkeyButtonTypes.ToggleViewEquipment);
    const toggleInventoryHotkeys = hotkeysStore.getKeybind(HotkeyButtonTypes.ToggleInventory);

    return (
      <ul className="flex">
        <GoBackButton extraHotkeys={toggleInventoryHotkeys} />
        <ActionMenuTopButton
          hotkeys={viewEquipmentHotkeys}
          handleClick={() => {
            AppStore.get().actionMenuStore.pushStack(
              MenuStatePool.get(MenuStateType.ViewingEquipedItems)
            );
          }}
        >
          Equipped ({hotkeysStore.getKeybindString(HotkeyButtonTypes.ToggleViewEquipment)})
        </ActionMenuTopButton>
        <ViewAbilityTreeButton />
      </ul>
    );
  }

  getNumberedButtons() {
    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
    const itemsInInventory = focusedCharacter.combatantProperties.inventory.getItems();

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
