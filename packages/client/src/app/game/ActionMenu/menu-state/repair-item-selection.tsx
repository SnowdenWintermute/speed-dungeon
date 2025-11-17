import { ItemsMenuState } from "./items";
import {
  ClientToServerEvent,
  CraftingAction,
  Equipment,
  Item,
  getCraftingActionPrice,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { PriceDisplay } from "../../character-sheet/ShardsDisplay";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory } from "./action-buttons-by-category";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuState } from ".";
import GoBackButton from "./common-buttons/GoBackButton";
import ToggleInventoryButton from "./common-buttons/ToggleInventory";

export class RepairItemSelectionMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.RepairItemSelection);
  }
  // (item: Item) => {
  //   const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
  //   websocketConnection.emit(ClientToServerEvent.PerformCraftingAction, {
  //     characterId: focusedCharacter.getEntityId(),
  //     itemId: item.entityProperties.id,
  //     craftingAction: CraftingAction.Repair,
  //   });
  // },
  // () => {
  //   const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
  //   return focusedCharacter.combatantProperties.inventory
  //   .getOwnedEquipment()
  //   .filter((equipment) => {
  //     const durability = equipment.getDurability();
  //     return durability !== null && durability.current !== durability.max;
  //   });
  // },
  // {
  //   extraButtons: {
  //     [ActionButtonCategory.Top]: [setInventoryOpen],
  //   },
  //   getItemButtonCustomChildren: (item: Item) => {
  //     if (!(item instanceof Equipment) || item.getNormalizedPercentRepaired() >= 1)
  //       return <></>;
  //     const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();

  //     const price = getCraftingActionPrice(CraftingAction.Repair, item);
  //     const durability = item.getDurability();
  //     return (
  //       <div className="absolute right-2 top-1/2 -translate-y-1/2 flex">
  //       {durability && (
  //         <div
  //         className={`mr-2 w-fit flex pr-2 pl-2 h-8 items-center bg-slate-700 border border-slate-400
  //           ${durability.current === 0 ? UNMET_REQUIREMENT_TEXT_COLOR : "text-zinc-300"}
  //           `}
  //           >
  //           {durability.current}/{durability.max}
  //           </div>
  //       )}
  //       <PriceDisplay
  //       price={price}
  //       shardsOwned={focusedCharacter.combatantProperties.inventory.shards}
  //       />
  //       </div>
  //     );
  //   },
  // }
  //   );

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
