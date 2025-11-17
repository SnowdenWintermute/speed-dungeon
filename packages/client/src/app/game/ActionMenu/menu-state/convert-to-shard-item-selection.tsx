import { ItemsMenuState } from "./items";
import { Item, getItemSellPrice } from "@speed-dungeon/common";
import { PriceDisplay } from "../../character-sheet/ShardsDisplay";
import { ConfirmConvertToShardsMenuState } from "./confirm-convert-to-shards";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory } from "./action-buttons-by-category";
import { ActionMenuState } from ".";
import GoBackButton from "./common-buttons/GoBackButton";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";

export class ConvertToShardItemSelectionMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.ShardItemSelection);
  }

  // (item: Item) => {
  //   const { focusStore, actionMenuStore } = AppStore.get();
  //   focusStore.detailables.setDetailed(item);
  //   actionMenuStore.pushStack(
  //     new ConfirmConvertToShardsMenuState(item, MenuStateType.ConfimConvertToShards)
  //   );
  // },
  // () => {
  //   const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
  //   const items: Item[] = [
  //     ...focusedCharacter.combatantProperties.inventory.getOwnedEquipment(),
  //     ...focusedCharacter.combatantProperties.inventory.consumables,
  //   ];
  //   return items;
  // },
  // {
  //   getItemButtonCustomChildren: (item: Item) => {
  //     return (
  //       <div className="absolute right-2 top-1/2 -translate-y-1/2 flex">
  //         <PriceDisplay price={getItemSellPrice(item)} shardsOwned={null} />
  //       </div>
  //     );
  //   },
  // }
  // );

  getTopSection() {
    return (
      <ul className="flex">
        <GoBackButton />
        <ToggleInventoryButton />
      </ul>
    );
  }

  getNumberedButtons() {
    return [];
  }
}
