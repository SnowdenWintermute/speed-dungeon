import { ActionButtonCategory, MenuStateType } from ".";
import { immerable } from "immer";
import { ItemsMenuState } from "./items";
import { toggleInventoryHotkey } from "./base";
import { CombatantProperties, Item } from "@speed-dungeon/common";
import selectItem from "@/utils/selectItem";
import { CraftingItemMenuState } from "./crafting-item";
import { useGameStore } from "@/stores/game-store";

export class CraftingItemSelectionMenuState extends ItemsMenuState {
  [immerable] = true;
  page = 1;
  numPages = 1;
  constructor() {
    super(
      MenuStateType.CraftingItemSelection,
      { text: "Close Inventory", hotkeys: ["KeyI", toggleInventoryHotkey] },
      (item: Item) => {
        selectItem(item);
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.push(new CraftingItemMenuState(item));
        });
      },
      () => {
        const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
        if (focusedCharacterResult instanceof Error) return [];
        return CombatantProperties.getOwnedEquipment(focusedCharacterResult.combatantProperties);
      },
      {
        [ActionButtonCategory.Top]: [],
      }
    );
  }
}
