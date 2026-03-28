import { ClientApplication } from "@/client-application";
import { ActionMenuScreen } from ".";
import { ConsumableType, createDummyConsumable } from "@speed-dungeon/common";
import { ActionMenuScreenType } from "../screen-types";
import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";
import { VendingMachineShardDisplay } from "@/app/game/ActionMenu/VendingMachineShardDisplay";
import ToggleInventoryButton from "@/app/game/ActionMenu/menu-state/common-buttons/ToggleInventory";
import { PurchaseItemButton } from "@/app/game/ActionMenu/menu-state/common-buttons/PurchaseItemButton";

const purchaseableConsumableTypes = [ConsumableType.HpAutoinjector, ConsumableType.MpAutoinjector];
export const SHOP_CONSUMABLES = purchaseableConsumableTypes.map((consumableType) =>
  createDummyConsumable(consumableType)
);

export class PurchaseItemsActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.PurchasingItems);
  }

  getTopSection() {
    return (
      <ul className="flex w-full">
        <GoBackButton
          extraFn={() => {
            this.clientApplication.detailableEntityFocus.detailables.clear();
          }}
        />
        <ToggleInventoryButton />
        <VendingMachineShardDisplay />
      </ul>
    );
  }

  getNumberedButtons() {
    return SHOP_CONSUMABLES.map((consumable, i) => (
      <PurchaseItemButton key={i} item={consumable} listIndex={i} />
    ));
  }
}
