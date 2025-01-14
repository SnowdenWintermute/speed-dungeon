import { ActionButtonCategory, MenuStateType } from ".";
import { immerable } from "immer";
import { ItemsMenuState } from "./items";
import { CombatantProperties, Item, getItemSellPrice } from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";
import { setInventoryOpen } from "./common-buttons/open-inventory";
import { PriceDisplay } from "../../character-sheet/ShardsDisplay";
import { ConfirmConvertToShardsMenuState } from "./confirm-convert-to-shards";

export class ConvertToShardItemSelectionMenuState extends ItemsMenuState {
  [immerable] = true;
  page = 1;
  numPages = 1;
  constructor() {
    super(
      MenuStateType.ShardItemSelection,
      { text: "Cancel", hotkeys: [] },
      (item: Item) => {
        useGameStore.getState().mutateState((state) => {
          state.detailedEntity = item;
          state.stackedMenuStates.push(
            new ConfirmConvertToShardsMenuState(item, MenuStateType.ConfimConvertToShards)
          );
        });
      },
      () => {
        const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
        if (focusedCharacterResult instanceof Error) return [];
        const items: Item[] = [
          ...CombatantProperties.getOwnedEquipment(focusedCharacterResult.combatantProperties),
          ...focusedCharacterResult.combatantProperties.inventory.consumables,
        ];
        return items;
      },
      {
        extraButtons: {
          [ActionButtonCategory.Top]: [setInventoryOpen],
        },
        getItemButtonCustomChildren: (item: Item) => {
          return (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex">
              <PriceDisplay price={getItemSellPrice(item)} />
            </div>
          );
        },
      }
    );
  }
}
