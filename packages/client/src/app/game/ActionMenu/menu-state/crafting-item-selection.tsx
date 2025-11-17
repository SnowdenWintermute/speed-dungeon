import { ItemsMenuState } from "./items";
import { ERROR_MESSAGES, Equipment, Item } from "@speed-dungeon/common";
import { CraftingItemMenuState } from "./crafting-item";
import { setAlert } from "@/app/components/alerts";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory } from "./action-buttons-by-category";
import { ActionMenuState } from ".";
import GoBackButton from "./common-buttons/GoBackButton";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";

export class CraftingItemSelectionMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.CraftingItemSelection);
  }

  // (item: Item) => {
  //   AppStore.get().focusStore.selectItem(item);
  //   if (!(item instanceof Equipment)) return setAlert(ERROR_MESSAGES.ITEM.INVALID_TYPE);
  //   AppStore.get().actionMenuStore.pushStack(new CraftingItemMenuState(item));
  // },
  // () => {
  //   const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
  //   return focusedCharacter.combatantProperties.inventory.getOwnedEquipment();
  // },

  getTopSection() {
    return (
      <ul className="flex">
        <GoBackButton />
        <ToggleInventoryButton />
      </ul>
    );
  }

  getNumberedButtons() {
    return [];
  }
}
