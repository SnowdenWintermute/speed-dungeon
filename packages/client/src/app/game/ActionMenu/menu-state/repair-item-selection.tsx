import { MenuStateType } from "./menu-state-type";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuState } from ".";
import GoBackButton from "./common-buttons/GoBackButton";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";
import { RepairEquipmentButton } from "./common-buttons/RepairEquipmentButton";
import EmptyItemsList from "./common-buttons/EmptyItemsList";
import { VendingMachineShardDisplay } from "../VendingMachineShardDisplay";

export class RepairItemSelectionMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.RepairItemSelection);
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
    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
    const ownedEquipment = focusedCharacter.combatantProperties.inventory.getOwnedEquipment();

    return ownedEquipment
      .filter((equipment) => !equipment.isFullyRepaired())
      .map((equipment, i) => <RepairEquipmentButton key={i} equipment={equipment} listIndex={i} />);
  }

  getCentralSection() {
    if (this.getNumberedButtons().length === 0) {
      return <EmptyItemsList />;
    } else {
      return "";
    }
  }
}
