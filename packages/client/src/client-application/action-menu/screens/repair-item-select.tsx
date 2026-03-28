import { ClientApplication } from "@/client-application";
import { ActionMenuScreen } from ".";
import { ActionMenuScreenType } from "../screen-types";
import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";
import ToggleInventoryButton from "@/app/game/ActionMenu/menu-state/common-buttons/ToggleInventory";
import { VendingMachineShardDisplay } from "@/app/game/ActionMenu/VendingMachineShardDisplay";
import { RepairEquipmentButton } from "@/app/game/ActionMenu/menu-state/common-buttons/RepairEquipmentButton";

export class RepairItemSelectionActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.RepairItemSelection);
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
    const focusedCharacter = this.clientApplication.combatantFocus.requireFocusedCharacter();
    const ownedEquipment = focusedCharacter.combatantProperties.inventory.getOwnedEquipment();

    return ownedEquipment
      .filter((equipment) => !equipment.isFullyRepaired())
      .map((equipment, i) => <RepairEquipmentButton key={i} equipment={equipment} listIndex={i} />);
  }
}
