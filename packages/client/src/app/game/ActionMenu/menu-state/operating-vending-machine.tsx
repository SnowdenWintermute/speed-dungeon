import { ActionMenuState } from ".";
import { HOTKEYS } from "@/hotkeys";
import { MenuStateType } from "./menu-state-type";
import makeAutoObservable from "mobx-store-inheritance";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";
import GoBackButton from "./common-buttons/GoBackButton";
import { ActionMenuNumberedButton } from "./common-buttons/ActionMenuNumberedButton";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";
import { AppStore } from "@/mobx-stores/app-store";
import { VendingMachineShardDisplay } from "../VendingMachineShardDisplay";

export const operateVendingMachineHotkey = HOTKEYS.SIDE_2;

export class OperatingVendingMachineMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.OperatingVendingMachine);
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
    const { actionMenuStore, gameStore } = AppStore.get();
    const userControlsThisCharacter = gameStore.clientUserControlsFocusedCombatant();

    const buttonBlueprints: {
      title: string;
      clickHandler: () => void;
      disabledCondition?: () => boolean;
    }[] = [
      {
        title: "Purchase Items",
        clickHandler: () => {
          actionMenuStore.pushStack(MenuStatePool.get(MenuStateType.PurchasingItems));
        },
      },
      {
        title: "Craft",
        clickHandler: () => {
          actionMenuStore.pushStack(MenuStatePool.get(MenuStateType.CraftingItemSelection));
        },
      },
      {
        title: "Repair",
        clickHandler: () => {
          actionMenuStore.pushStack(MenuStatePool.get(MenuStateType.RepairItemSelection));
        },
      },
      {
        title: "Convert to Shards",
        clickHandler: () => {
          actionMenuStore.pushStack(MenuStatePool.get(MenuStateType.ShardItemSelection));
        },
      },
      {
        title: "Trade for Books",
        clickHandler: () => {
          actionMenuStore.pushStack(MenuStatePool.get(MenuStateType.SelectingBookType));
        },

        disabledCondition: () => {
          const party = AppStore.get().gameStore.getExpectedParty();
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
          <div className={`flex w-full items-center ${disabledStyles}`}>{blueprint.title}</div>
        </ActionMenuNumberedButton>
      );
    });
  }
}
