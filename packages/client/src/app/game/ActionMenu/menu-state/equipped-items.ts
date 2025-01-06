import { MenuStateType } from ".";
import { immerable } from "immer";
import { ItemsMenuState } from "./items";
import { HOTKEYS } from "@/hotkeys";
import { CombatantEquipment, Item } from "@speed-dungeon/common";
import selectItem from "@/utils/selectItem";
import { ConsideringItemMenuState } from "./considering-item";
import { useGameStore } from "@/stores/game-store";

export const viewEquipmentHotkey = HOTKEYS.ALT_1;
export class EquippedItemsMenuState extends ItemsMenuState {
  [immerable] = true;
  page = 1;
  numPages = 1;
  constructor() {
    super(
      MenuStateType.ViewingEquipedItems,
      { text: "Go Back", hotkeys: [viewEquipmentHotkey] },
      (item: Item) => {
        selectItem(item);
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.push(new ConsideringItemMenuState(item));
        });
      },
      () => {
        const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
        if (focusedCharacterResult instanceof Error) return [];
        return Object.values(
          CombatantEquipment.getAllEquippedItems(focusedCharacterResult.combatantProperties)
        );
      }
    );
  }
}
