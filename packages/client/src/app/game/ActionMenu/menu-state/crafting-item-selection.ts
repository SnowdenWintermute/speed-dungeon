import { ActionButtonCategory, MenuStateType } from ".";
import { immerable } from "immer";
import { ItemsMenuState } from "./items";
import { CombatantProperties, ERROR_MESSAGES, Equipment, Item } from "@speed-dungeon/common";
import selectItem from "@/utils/selectItem";
import { CraftingItemMenuState } from "./crafting-item";
import { useGameStore } from "@/stores/game-store";
import { setAlert } from "@/app/components/alerts";

export class CraftingItemSelectionMenuState extends ItemsMenuState {
  [immerable] = true;
  page = 1;
  numPages = 1;
  constructor() {
    super(
      MenuStateType.CraftingItemSelection,
      { text: "Go Back", hotkeys: [] },
      (item: Item) => {
        selectItem(item);
        useGameStore.getState().mutateState((state) => {
          if (!(item instanceof Equipment)) return setAlert(ERROR_MESSAGES.ITEM.INVALID_TYPE);
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
