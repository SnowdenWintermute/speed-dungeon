import { ActionMenuState } from ".";
import { ConsumableType, createDummyConsumable } from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";
import GoBackButton from "./common-buttons/GoBackButton";
import { PurchaseItemButton } from "./common-buttons/PurchaseItemButton";

const purchaseableConsumableTypes = [ConsumableType.HpAutoinjector, ConsumableType.MpAutoinjector];
export const SHOP_CONSUMABLES = purchaseableConsumableTypes.map((consumableType) =>
  createDummyConsumable(consumableType)
);

export class PurchaseItemsMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.PurchasingItems);
  }

  getTopSection() {
    return (
      <ul className="flex">
        <GoBackButton
          extraFn={() => {
            AppStore.get().focusStore.detailables.clear();
          }}
        />
        <ToggleInventoryButton />
      </ul>
    );
  }

  getNumberedButtons() {
    return SHOP_CONSUMABLES.map((consumable, i) => (
      <PurchaseItemButton key={i} item={consumable} listIndex={i} />
    ));
  }
}
