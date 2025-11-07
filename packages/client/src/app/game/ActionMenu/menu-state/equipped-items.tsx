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

  // { text: "Go Back", hotkeys: [viewEquipmentHotkey] },
  // (item: Item) => {
  //   AppStore.get().focusStore.selectItem(item);
  //   AppStore.get().actionMenuStore.pushStack(new ConsideringItemMenuState(item));
  // },
  // () => {
  //   const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
  //   return Object.values(
  //     focusedCharacter.combatantProperties.equipment.getAllEquippedItems({
  //       includeUnselectedHotswapSlots: false,
  //     })
  //   );
  // },
  // {}

  getTopSection(): ReactNode {
    const viewEquipmentHotkeys = AppStore.get().hotkeys.getKeybind(
      HotkeyButtonTypes.ToggleViewEquipment
    );
    return (
      <ul className="flex">
        <GoBackButton extraHotkeys={viewEquipmentHotkeys} />
      </ul>
    );
  }

  recalculateButtons(): void {
    return;
  }
}
