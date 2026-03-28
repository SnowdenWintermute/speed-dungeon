import { ERROR_MESSAGES, Equipment, Item } from "@speed-dungeon/common";
import { ActionMenuScreen } from ".";
import makeAutoObservable from "mobx-store-inheritance";
import { ActionMenuScreenType } from "../screen-types";
import { ClientApplication } from "@/client-application";
import ToggleInventoryButton from "@/app/game/ActionMenu/menu-state/common-buttons/ToggleInventory";
import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";
import { VendingMachineShardDisplay } from "@/app/game/ActionMenu/VendingMachineShardDisplay";
import { CraftingItemActionMenuScreen } from "./crafting-item";

export class CraftingItemSelectionActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.CraftingItemSelection);
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
    const focusedCharacter = this.clientApplication.combatantFocus.requireFocusedCharacter();
    const ownedEquipment = focusedCharacter.combatantProperties.inventory.getOwnedEquipment();
    const { detailableEntityFocus, actionMenu, alertsService } = this.clientApplication;
    const clientApplication = this.clientApplication;

    function clickHandler(item: Item) {
      detailableEntityFocus.selectItem(item);
      if (!(item instanceof Equipment)) {
        alertsService.setAlert(ERROR_MESSAGES.ITEM.INVALID_TYPE);
        return;
      }
      actionMenu.pushStack(new CraftingItemActionMenuScreen(clientApplication, item));
    }

    return ActionMenuScreen.getItemButtonsFromList(ownedEquipment, clickHandler, () => false);
  }
}
