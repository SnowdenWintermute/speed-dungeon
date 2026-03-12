import { ClientApplication } from "@/client-application";
import { ActionMenuScreen } from ".";
import { CraftingAction, Equipment, iterateNumericEnum } from "@speed-dungeon/common";
import makeAutoObservable from "mobx-store-inheritance";
import { ActionMenuScreenType } from "../screen-types";
import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";
import ToggleInventoryButton from "@/app/game/ActionMenu/menu-state/common-buttons/ToggleInventory";
import { VendingMachineShardDisplay } from "@/app/game/ActionMenu/VendingMachineShardDisplay";
import { CraftActionButton } from "@/app/game/ActionMenu/menu-state/common-buttons/CraftActionButton";

export class CraftingItemActionMenuScreen extends ActionMenuScreen {
  constructor(
    clientApplication: ClientApplication,
    public item: Equipment
  ) {
    super(clientApplication, ActionMenuScreenType.CraftingActionSelection);
    makeAutoObservable(this);
  }

  getTopSection() {
    return (
      <ul className="flex w-full">
        <GoBackButton
          extraFn={() => {
            this.clientApplication.detailableEntityFocus.selectItem(null);
          }}
        />
        <ToggleInventoryButton />
        <VendingMachineShardDisplay />
      </ul>
    );
  }

  getNumberedButtons() {
    return iterateNumericEnum(CraftingAction).map((craftingAction, i) => (
      <CraftActionButton
        key={craftingAction}
        equipment={this.item}
        craftingAction={craftingAction}
        listIndex={i}
      />
    ));
  }
}
