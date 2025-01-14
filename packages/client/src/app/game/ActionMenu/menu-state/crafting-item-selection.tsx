import { ActionButtonCategory, MenuStateType } from ".";
import { immerable } from "immer";
import { ItemsMenuState } from "./items";
import { CombatantProperties, ERROR_MESSAGES, Equipment, Item } from "@speed-dungeon/common";
import selectItem from "@/utils/selectItem";
import { CraftingItemMenuState } from "./crafting-item";
import { useGameStore } from "@/stores/game-store";
import { setAlert } from "@/app/components/alerts";
import { setInventoryOpen } from "./common-buttons/open-inventory";

export class CraftingItemSelectionMenuState extends ItemsMenuState {
  [immerable] = true;
  page = 1;
  numPages = 1;
  constructor() {
    super(
      MenuStateType.CraftingItemSelection,
      { text: "Cancel", hotkeys: [] },
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
        extraButtons: { [ActionButtonCategory.Top]: [setInventoryOpen] },
      }
    );
  }
}
