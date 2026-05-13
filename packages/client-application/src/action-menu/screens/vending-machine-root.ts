import { ClientApplication } from "../../";
import { ActionMenuScreen } from ".";
import makeAutoObservable from "mobx-store-inheritance";
import { ActionMenuScreenType } from "../screen-types";
import {
  ActionMenuTopSectionItem,
  ActionMenuTopSectionItemType,
  ActionMenuNumberedButtonDescriptor,
  ActionMenuNumberedButtonType,
} from "../action-menu-display-data";

export class OperatingVendingMachineActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.OperatingVendingMachine);
    makeAutoObservable(this);
  }

  getTopSection(): ActionMenuTopSectionItem[] {
    return [
      { type: ActionMenuTopSectionItemType.GoBack, data: {} },
      { type: ActionMenuTopSectionItemType.ToggleInventory, data: undefined },
      { type: ActionMenuTopSectionItemType.VendingMachineShards, data: undefined },
    ];
  }

  getNumberedButtons(): ActionMenuNumberedButtonDescriptor[] {
    const { actionMenu, combatantFocus } = this.clientApplication;
    const userControlsThisCharacter = combatantFocus.clientUserControlsFocusedCombatant();

    const buttonBlueprints: {
      title: string;
      onClick: () => void;
      disabledCondition?: () => boolean;
    }[] = [
      {
        title: "Purchase Items",
        onClick: () => actionMenu.pushFromPool(ActionMenuScreenType.PurchasingItems),
      },
      {
        title: "Craft",
        onClick: () => actionMenu.pushFromPool(ActionMenuScreenType.CraftingItemSelection),
      },
      {
        title: "Repair",
        onClick: () => actionMenu.pushFromPool(ActionMenuScreenType.RepairItemSelection),
      },
      {
        title: "Convert to Shards",
        onClick: () => actionMenu.pushFromPool(ActionMenuScreenType.ShardItemSelection),
      },
      {
        title: "Trade for Books",
        onClick: () => actionMenu.pushFromPool(ActionMenuScreenType.SelectingBookType),
        disabledCondition: () => {
          const party = this.clientApplication.gameContext.requireParty();
          const vendingMachineLevel = party.dungeonExplorationManager.getCurrentFloor();
          return Math.floor(vendingMachineLevel / 2) < 1;
        },
      },
    ];

    return buttonBlueprints.map((blueprint) => ({
      type: ActionMenuNumberedButtonType.VendingMachineOption as const,
      data: {
        title: blueprint.title,
        disabled: !userControlsThisCharacter || !!blueprint.disabledCondition?.(),
        onClick: blueprint.onClick,
      },
    }));
  }
}
