import { ActionMenuScreen } from ".";
import { ConsumableType, createDummyConsumable } from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ActionMenuScreenType } from "./menu-state-type";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";
import GoBackButton from "./common-buttons/GoBackButton";
import { PurchaseItemButton } from "./common-buttons/PurchaseItemButton";
import { VendingMachineShardDisplay } from "../VendingMachineShardDisplay";

const purchaseableConsumableTypes = [ConsumableType.HpAutoinjector, ConsumableType.MpAutoinjector];
export const SHOP_CONSUMABLES = purchaseableConsumableTypes.map((consumableType) =>
  createDummyConsumable(consumableType)
);

export class PurchaseItemsActionMenuScreen extends ActionMenuScreen {
  constructor() {
    super(ActionMenuScreenType.PurchasingItems);
  }

  getTopSection() {
    return (
      <ul className="flex w-full">
        <GoBackButton
          extraFn={() => {
            AppStore.get().focusStore.detailables.clear();
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
