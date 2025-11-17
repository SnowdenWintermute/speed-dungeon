import { ActionMenuState } from ".";
import { HOTKEYS } from "@/hotkeys";
import { MenuStateType } from "./menu-state-type";
import makeAutoObservable from "mobx-store-inheritance";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";
import GoBackButton from "./common-buttons/GoBackButton";

export const operateVendingMachineHotkey = HOTKEYS.SIDE_2;

export class OperatingVendingMachineMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.OperatingVendingMachine);
    makeAutoObservable(this);
  }

  getTopSection() {
    return (
      <ul className="flex">
        <GoBackButton />
        <ToggleInventoryButton />
      </ul>
    );
  }

  // getButtonProperties(): ActionButtonsByCategory {
  // const { actionMenuStore, gameStore } = AppStore.get();
  // const toReturn = new ActionButtonsByCategory();
  // const userControlsThisCharacter = gameStore.clientUserControlsFocusedCombatant();
  // const purchaseItemsButton = new ActionMenuButtonProperties(
  //   () => "Purchase Items",
  //   "Purchase Items",
  //   () => {
  //     actionMenuStore.pushStack(MenuStatePool.get(MenuStateType.PurchasingItems));
  //   }
  // );
  // purchaseItemsButton.shouldBeDisabled = !userControlsThisCharacter;
  // const craftButton = new ActionMenuButtonProperties(
  //   () => "Craft",
  //   "Craft",
  //   () => {
  //     actionMenuStore.pushStack(MenuStatePool.get(MenuStateType.CraftingItemSelection));
  //   }
  // );
  // const repairButton = new ActionMenuButtonProperties(
  //   () => "Repair",
  //   "Repair",
  //   () => {
  //     actionMenuStore.pushStack(MenuStatePool.get(MenuStateType.RepairItemSelection));
  //   }
  // );
  // const convertButton = new ActionMenuButtonProperties(
  //   () => "Convert to Shards",
  //   "Convert to Shards",
  //   () => {
  //     actionMenuStore.pushStack(MenuStatePool.get(MenuStateType.ShardItemSelection));
  //   }
  // );
  // const selectBooksButton = new ActionMenuButtonProperties(
  //   () => "Trade for Books",
  //   "Trade for Books",
  //   () => {
  //     actionMenuStore.pushStack(MenuStatePool.get(MenuStateType.SelectingBookType));
  //   }
  // );
  // const party = AppStore.get().gameStore.getExpectedParty();
  // const vendingMachineLevel = party.dungeonExplorationManager.getCurrentFloor();
  // const vmLevelLimiter = Math.floor(vendingMachineLevel / 2);
  // selectBooksButton.shouldBeDisabled = vmLevelLimiter < 1;
  // toReturn[ActionButtonCategory.Numbered].push(purchaseItemsButton);
  // toReturn[ActionButtonCategory.Numbered].push(craftButton);
  // toReturn[ActionButtonCategory.Numbered].push(repairButton);
  // toReturn[ActionButtonCategory.Numbered].push(convertButton);
  // toReturn[ActionButtonCategory.Numbered].push(selectBooksButton);
  // createPageButtons(toReturn);
  // return toReturn;
  // }
}
