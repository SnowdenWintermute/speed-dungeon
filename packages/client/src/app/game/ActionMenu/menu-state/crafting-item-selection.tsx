import { ItemsMenuState } from "./items";
import { ERROR_MESSAGES, Equipment, Item } from "@speed-dungeon/common";
import { CraftingItemMenuState } from "./crafting-item";
import { setAlert } from "@/app/components/alerts";
import { setInventoryOpen } from "./common-buttons/open-inventory";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory } from "./action-buttons-by-category";

export class CraftingItemSelectionMenuState extends ItemsMenuState {
  constructor() {
    super(
      MenuStateType.CraftingItemSelection,
      { text: "Cancel", hotkeys: [] },
      (item: Item) => {
        AppStore.get().focusStore.selectItem(item);
        if (!(item instanceof Equipment)) return setAlert(ERROR_MESSAGES.ITEM.INVALID_TYPE);
        AppStore.get().actionMenuStore.pushStack(new CraftingItemMenuState(item));
      },
      () => {
        const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
        return focusedCharacter.combatantProperties.inventory.getOwnedEquipment();
      },
      {
        extraButtons: { [ActionButtonCategory.Top]: [setInventoryOpen] },
      }
    );
  }
}
