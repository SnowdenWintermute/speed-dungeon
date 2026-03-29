import { ClientApplication } from "../../";
import { ActionMenuScreen } from ".";
import { ActionMenuScreenType } from "../screen-types";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuNumberedButtonDescriptor,
  ActionMenuNumberedButtonType,
} from "../action-menu-display-data";

export class RepairItemSelectionActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.RepairItemSelection);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    return [
      { type: ActionMenuTopSectionItemType.GoBack, data: {} },
      { type: ActionMenuTopSectionItemType.ToggleInventory, data: undefined },
      { type: ActionMenuTopSectionItemType.VendingMachineShards, data: undefined },
    ];
  }

  getNumberedButtons(): ActionMenuNumberedButtonDescriptor[] {
    const focusedCharacter = this.clientApplication.combatantFocus.requireFocusedCharacter();
    const ownedEquipment = focusedCharacter.combatantProperties.inventory.getOwnedEquipment();

    return ownedEquipment
      .filter((equipment) => !equipment.isFullyRepaired())
      .map((equipment, i) => ({
        type: ActionMenuNumberedButtonType.RepairEquipment as const,
        data: { equipment, listIndex: i },
      }));
  }
}
