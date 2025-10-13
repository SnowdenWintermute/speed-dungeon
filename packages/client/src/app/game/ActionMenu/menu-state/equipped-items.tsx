import { MenuStateType } from ".";
import { ItemsMenuState } from "./items";
import { HOTKEYS } from "@/hotkeys";
import { CombatantEquipment, Item } from "@speed-dungeon/common";
import { ConsideringItemMenuState } from "./considering-item";
import { useGameStore } from "@/stores/game-store";
import { AppStore } from "@/mobx-stores/app-store";

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
        const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
        if (focusedCharacterResult instanceof Error) return [];
        return Object.values(
          CombatantEquipment.getAllEquippedItems(
            focusedCharacterResult.combatantProperties.equipment,
            {
              includeUnselectedHotswapSlots: false,
            }
          )
        );
      },
      {}
    );
  }
}
