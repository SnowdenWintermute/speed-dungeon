import { ERROR_MESSAGES, Equipment, Item } from "@speed-dungeon/common";
import { CraftingItemActionMenuScreen } from "./crafting-item";
import { setAlert } from "@/app/components/alerts";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuScreenType } from "./menu-state-type";
import { ActionMenuScreen } from ".";
import GoBackButton from "./common-buttons/GoBackButton";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";
import makeAutoObservable from "mobx-store-inheritance";
import { VendingMachineShardDisplay } from "../VendingMachineShardDisplay";

export class CraftingItemSelectionActionMenuScreen extends ActionMenuScreen {
  constructor() {
    super(ActionMenuScreenType.CraftingItemSelection);
    makeAutoObservable(this);
  }

  getTopSection() {
    return (
      <ul className="flex w-full">
        <GoBackButton />
        <ToggleInventoryButton />
        <VendingMachineShardDisplay />
      </ul>
    );
  }

  getNumberedButtons() {
    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
    const ownedEquipment = focusedCharacter.combatantProperties.inventory.getOwnedEquipment();

    function clickHandler(item: Item) {
      AppStore.get().focusStore.selectItem(item);
      if (!(item instanceof Equipment)) return setAlert(ERROR_MESSAGES.ITEM.INVALID_TYPE);
      AppStore.get().actionMenuStore.pushStack(new CraftingItemActionMenuScreen(item));
    }

    return ActionMenuScreen.getItemButtonsFromList(ownedEquipment, clickHandler, () => false);
  }
}
