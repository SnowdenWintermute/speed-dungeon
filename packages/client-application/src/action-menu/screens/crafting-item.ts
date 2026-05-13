import { ClientApplication } from "../../";
import { ActionMenuScreen } from ".";
import { CraftingAction, Equipment, iterateNumericEnum } from "@speed-dungeon/common";
import makeAutoObservable from "mobx-store-inheritance";
import { ActionMenuScreenType } from "../screen-types";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuNumberedButtonDescriptor,
  ActionMenuNumberedButtonType,
  ActionMenuSidePanelSection,
  ActionMenuSidePanelSectionType,
} from "../action-menu-display-data";

export class CraftingItemActionMenuScreen extends ActionMenuScreen {
  constructor(
    clientApplication: ClientApplication,
    public item: Equipment
  ) {
    super(clientApplication, ActionMenuScreenType.CraftingActionSelection);
    makeAutoObservable(this);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    return [
      {
        type: ActionMenuTopSectionItemType.GoBack,
        data: {
          extraFn: () => {
            this.clientApplication.detailableEntityFocus.selectItem(null);
          },
        },
      },
      { type: ActionMenuTopSectionItemType.ToggleInventory, data: undefined },
      { type: ActionMenuTopSectionItemType.VendingMachineShards, data: undefined },
    ];
  }

  getNumberedButtons(): ActionMenuNumberedButtonDescriptor[] {
    return iterateNumericEnum(CraftingAction).map((craftingAction, i) => ({
      type: ActionMenuNumberedButtonType.CraftAction as const,
      data: {
        equipment: this.item,
        craftingAction,
        listIndex: i,
      },
    }));
  }

  getSidePanelSection(): ActionMenuSidePanelSection {
    return {
      type: ActionMenuSidePanelSectionType.CraftingItem,
      data: { equipment: this.item },
    };
  }
}
