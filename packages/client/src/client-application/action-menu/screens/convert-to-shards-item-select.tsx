import { Item, getItemSellPrice } from "@speed-dungeon/common";
import { ActionMenuScreen } from ".";
import makeAutoObservable from "mobx-store-inheritance";
import { ClientApplication } from "@/client-application";
import { ActionMenuScreenType } from "../screen-types";
import GoBackButton from "@/app/game/ActionMenu/menu-state/common-buttons/GoBackButton";
import ToggleInventoryButton from "@/app/game/ActionMenu/menu-state/common-buttons/ToggleInventory";
import { VendingMachineShardDisplay } from "@/app/game/ActionMenu/VendingMachineShardDisplay";
import { PriceDisplay } from "@/app/game/character-sheet/ShardsDisplay";
import { ConfirmConvertToShardsActionMenuScreen } from "./convert-to-shards-confirm";

export class ConvertToShardItemSelectionActionMenuScreen extends ActionMenuScreen {
  constructor(clientApplication: ClientApplication) {
    super(clientApplication, ActionMenuScreenType.ShardItemSelection);
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
    const { combatantFocus, detailableEntityFocus, actionMenu } = this.clientApplication;
    const focusedCharacter = combatantFocus.requireFocusedCharacter();
    const { combatantProperties } = focusedCharacter;
    const allOwnedItems = combatantProperties.inventory.getAllOwned();
    const clientApplication = this.clientApplication;

    function clickHandler(item: Item) {
      detailableEntityFocus.detailables.setDetailed(item);
      detailableEntityFocus.detailables.setHovered(item);
      actionMenu.pushStack(
        new ConfirmConvertToShardsActionMenuScreen(
          clientApplication,
          item,
          ActionMenuScreenType.ConfimConvertToShards
        )
      );
    }

    return ActionMenuScreen.getItemButtonsFromList(
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
