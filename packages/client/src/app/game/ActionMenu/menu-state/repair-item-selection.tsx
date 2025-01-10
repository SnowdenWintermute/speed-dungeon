import { ActionButtonCategory, MenuStateType } from ".";
import { immerable } from "immer";
import { ItemsMenuState } from "./items";
import {
  ClientToServerEvent,
  CombatantProperties,
  CraftingAction,
  Equipment,
  Item,
  getCraftingActionPrice,
} from "@speed-dungeon/common";
import { useGameStore } from "@/stores/game-store";
import { setInventoryOpen } from "./common-buttons/open-inventory";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import { PriceDisplay } from "../../character-sheet/ShardsDisplay";

export class RepairItemSelectionMenuState extends ItemsMenuState {
  [immerable] = true;
  page = 1;
  numPages = 1;
  constructor() {
    super(
      MenuStateType.RepairItemSelection,
      { text: "Cancel", hotkeys: [] },
      (item: Item) => {
        const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
        if (focusedCharacterResult instanceof Error) {
          setAlert(focusedCharacterResult.message);
          return;
        }
        websocketConnection.emit(ClientToServerEvent.PerformCraftingAction, {
          characterId: focusedCharacterResult.entityProperties.id,
          itemId: item.entityProperties.id,
          craftingAction: CraftingAction.Repair,
        });
      },
      () => {
        const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
        if (focusedCharacterResult instanceof Error) return [];
        return CombatantProperties.getOwnedEquipment(focusedCharacterResult.combatantProperties);
      },
      {
        extraButtons: {
          [ActionButtonCategory.Top]: [setInventoryOpen],
        },
        getItemButtonCustomChildren: (item: Item) => {
          if (!(item instanceof Equipment) || Equipment.getNormalizedPercentRepaired(item) >= 1)
            return <></>;
          return (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex">
              {item.durability && (
                <div className="mr-2 w-fit flex pr-2 pl-2 h-8 items-center bg-slate-700 border border-slate-400">
                  {item.durability.current}/{item.durability.max}
                </div>
              )}
              <PriceDisplay price={getCraftingActionPrice(CraftingAction.Repair, item)} />
            </div>
          );
        },
      }
    );
  }
}
