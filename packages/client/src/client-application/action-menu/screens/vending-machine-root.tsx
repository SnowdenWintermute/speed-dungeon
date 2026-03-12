import { ClientApplication } from "@/client-application";
import { ActionMenuScreen } from ".";
import makeAutoObservable from "mobx-store-inheritance";
import { ActionMenuScreenType } from "../screen-types";
import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";
import ToggleInventoryButton from "@/app/game/ActionMenu/menu-state/common-buttons/ToggleInventory";
import { VendingMachineShardDisplay } from "@/app/game/ActionMenu/VendingMachineShardDisplay";
import { ActionMenuNumberedButton } from "@/app/game/ActionMenu/menu-state/common-buttons/ActionMenuNumberedButton";

export class OperatingVendingMachineActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.OperatingVendingMachine);
    makeAutoObservable(this);
  }

  getTopSection() {
    return (
      <ul className="flex w-full">
        <GoBackButton />
        <ToggleInventoryButton />
        <VendingMachineShardDisplay />
      </ul>
    );
  }

  getNumberedButtons() {
    const { actionMenu, combatantFocus } = this.clientApplication;
    const userControlsThisCharacter = combatantFocus.clientUserControlsFocusedCombatant();

    const buttonBlueprints: {
      title: string;
      clickHandler: () => void;
      disabledCondition?: () => boolean;
    }[] = [
      {
        title: "Purchase Items",
        clickHandler: () => {
          actionMenu.pushFromPool(ActionMenuScreenType.PurchasingItems);
        },
      },
      {
        title: "Craft",
        clickHandler: () => {
          actionMenu.pushFromPool(ActionMenuScreenType.CraftingItemSelection);
        },
      },
      {
        title: "Repair",
        clickHandler: () => {
          actionMenu.pushFromPool(ActionMenuScreenType.RepairItemSelection);
        },
      },
      {
        title: "Convert to Shards",
        clickHandler: () => {
          actionMenu.pushFromPool(ActionMenuScreenType.ShardItemSelection);
        },
      },
      {
        title: "Trade for Books",
        clickHandler: () => {
          actionMenu.pushFromPool(ActionMenuScreenType.SelectingBookType);
        },

        disabledCondition: () => {
          const party = this.clientApplication.gameContext.requireParty();
          const vendingMachineLevel = party.dungeonExplorationManager.getCurrentFloor();
          const vmLevelLimiter = Math.floor(vendingMachineLevel / 2);
          return vmLevelLimiter < 1;
        },
      },
    ];

    return buttonBlueprints.map((blueprint, i) => {
      const disabled = !userControlsThisCharacter || !!blueprint.disabledCondition?.();
      const disabledStyles = disabled ? "opacity-50" : "";
      return (
        <ActionMenuNumberedButton
          key={blueprint.title}
          hotkeys={[`Digit${i + 1}`]}
          hotkeyLabel={(i + 1).toString()}
          clickHandler={blueprint.clickHandler}
          disabled={disabled}
        >
          <div className={`flex w-full items-center px-2 ${disabledStyles}`}>{blueprint.title}</div>
        </ActionMenuNumberedButton>
      );
    });
  }
}
