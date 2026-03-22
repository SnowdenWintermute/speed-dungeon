import { ActionMenuScreenType } from "./menu-state-type";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ActionMenuScreen } from ".";
import GoBackButton from "./common-buttons/GoBackButton";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";
import { RepairEquipmentButton } from "./common-buttons/RepairEquipmentButton";
import { VendingMachineShardDisplay } from "../VendingMachineShardDisplay";

export class RepairItemSelectionActionMenuScreen extends ActionMenuScreen {
  constructor() {
    super(ActionMenuScreenType.RepairItemSelection);
  }

  getTopSection() {
    return (
      <ul className="flex relative w-full">
        <GoBackButton />
        <ToggleInventoryButton />
        <VendingMachineShardDisplay />
      </ul>
    );
  }

  getNumberedButtons() {
    const focusedCharacter = clientApplication.combatantFocus.requireFocusedCharacter();
    const ownedEquipment = focusedCharacter.combatantProperties.inventory.getOwnedEquipment();

    return ownedEquipment
      .filter((equipment) => !equipment.isFullyRepaired())
      .map((equipment, i) => <RepairEquipmentButton key={i} equipment={equipment} listIndex={i} />);
  }
}
