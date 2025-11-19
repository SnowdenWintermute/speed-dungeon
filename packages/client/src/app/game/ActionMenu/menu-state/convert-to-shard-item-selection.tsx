import { Item, getItemSellPrice } from "@speed-dungeon/common";
import { PriceDisplay } from "../../character-sheet/ShardsDisplay";
import { ConfirmConvertToShardsMenuState } from "./confirm-convert-to-shards";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import { ActionMenuState } from ".";
import GoBackButton from "./common-buttons/GoBackButton";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";
import { VendingMachineShardDisplay } from "../VendingMachineShardDisplay";
import makeAutoObservable from "mobx-store-inheritance";

export class ConvertToShardItemSelectionMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.ShardItemSelection);
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
    const { focusStore, actionMenuStore, gameStore } = AppStore.get();
    const focusedCharacter = gameStore.getExpectedFocusedCharacter();
    const { combatantProperties } = focusedCharacter;
    const allOwnedItems = combatantProperties.inventory.getAllOwned();

    function clickHandler(item: Item) {
      focusStore.detailables.setDetailed(item);
      actionMenuStore.pushStack(
        new ConfirmConvertToShardsMenuState(item, MenuStateType.ConfimConvertToShards)
      );
    }

    return ActionMenuState.getItemButtonsFromList(
      allOwnedItems,
      clickHandler,
      () => false,
      (item) => (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex">
          {combatantProperties.equipment.isWearingItemWithId(item.entityProperties.id) && (
            <div
              className={`w-fit flex pr-2 pl-2 h-8 items-center bg-slate-700 border border-slate-400 `}
            >
              EQUIPPED
            </div>
          )}
          <PriceDisplay price={getItemSellPrice(item)} shardsOwned={null} />
        </div>
      )
    );
  }
}
