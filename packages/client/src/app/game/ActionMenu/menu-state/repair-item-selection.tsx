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
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";

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
        return CombatantProperties.getOwnedEquipment(
          focusedCharacterResult.combatantProperties
        ).filter((equipment) => {
          const durability = Equipment.getDurability(equipment);
          return durability !== null && durability.current !== durability.max;
        });
      },
      {
        extraButtons: {
          [ActionButtonCategory.Top]: [setInventoryOpen],
        },
        getItemButtonCustomChildren: (item: Item) => {
          if (!(item instanceof Equipment) || Equipment.getNormalizedPercentRepaired(item) >= 1)
            return <></>;
          const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
          if (focusedCharacterResult instanceof Error) return <></>;

          const price = getCraftingActionPrice(CraftingAction.Repair, item);
          const durability = Equipment.getDurability(item);
          return (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex">
              {durability && (
                <div
                  className={`mr-2 w-fit flex pr-2 pl-2 h-8 items-center bg-slate-700 border border-slate-400 
                ${durability.current === 0 ? UNMET_REQUIREMENT_TEXT_COLOR : "text-zinc-300"}
                `}
                >
                  {durability.current}/{durability.max}
                </div>
              )}
              <PriceDisplay
                price={price}
                shardsOwned={focusedCharacterResult.combatantProperties.inventory.shards}
              />
            </div>
          );
        },
      }
    );
  }
}
