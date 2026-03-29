import { ClientApplication } from "../../";
import { ActionMenuScreen } from ".";
import { ConsumableType, createDummyConsumable } from "@speed-dungeon/common";
import { ActionMenuScreenType } from "../screen-types";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuNumberedButtonDescriptor,
  ActionMenuNumberedButtonType,
} from "../action-menu-display-data";

const purchaseableConsumableTypes = [ConsumableType.HpAutoinjector, ConsumableType.MpAutoinjector];
export const SHOP_CONSUMABLES = purchaseableConsumableTypes.map((consumableType) =>
  createDummyConsumable(consumableType)
);

export class PurchaseItemsActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.PurchasingItems);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    return [
      {
        type: ActionMenuTopSectionItemType.GoBack,
        data: {
          extraFn: () => {
            this.clientApplication.detailableEntityFocus.detailables.clear();
          },
        },
      },
      { type: ActionMenuTopSectionItemType.ToggleInventory, data: undefined },
      { type: ActionMenuTopSectionItemType.VendingMachineShards, data: undefined },
    ];
  }

  getNumberedButtons(): ActionMenuNumberedButtonDescriptor[] {
    return SHOP_CONSUMABLES.map((consumable, i) => ({
      type: ActionMenuNumberedButtonType.PurchaseConsumable as const,
      data: { item: consumable, listIndex: i },
    }));
  }
}
