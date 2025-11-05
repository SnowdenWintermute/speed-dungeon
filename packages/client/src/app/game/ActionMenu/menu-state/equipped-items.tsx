import { ItemsMenuState } from "./items";
import { HOTKEYS } from "@/hotkeys";
import { Item } from "@speed-dungeon/common";
import { ConsideringItemMenuState } from "./considering-item";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";

export const viewEquipmentHotkey = HOTKEYS.ALT_1;
export class EquippedItemsMenuState extends ItemsMenuState {
  constructor() {
    super(
      MenuStateType.ViewingEquipedItems,
      { text: "Go Back", hotkeys: [viewEquipmentHotkey] },
      (item: Item) => {
        AppStore.get().focusStore.selectItem(item);
        AppStore.get().actionMenuStore.pushStack(new ConsideringItemMenuState(item));
      },
      () => {
        const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
        return Object.values(
          focusedCharacter.combatantProperties.equipment.getAllEquippedItems({
            includeUnselectedHotswapSlots: false,
          })
        );
      },
      {}
    );
  }
}
