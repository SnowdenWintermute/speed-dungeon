import { AppStore } from "@/mobx-stores/app-store";
import { websocketConnection } from "@/singletons/websocket-connection";
import {
  ClientToServerEvent,
  CraftingAction,
  Equipment,
  getCraftingActionPrice,
} from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";
import { ItemButton } from "./ItemButton";
import { PriceDisplay } from "@/app/game/character-sheet/ShardsDisplay";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";

interface Props {
  equipment: Equipment;
  listIndex: number;
}

export const RepairEquipmentButton = observer((props: Props) => {
  const { equipment, listIndex } = props;
  const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();

  const price = getCraftingActionPrice(CraftingAction.Repair, equipment);
  const durability = equipment.getDurability();
  if (durability === null) return <div>Indestructable item not shown</div>;

  function clickHandler() {
    websocketConnection.emit(ClientToServerEvent.PerformCraftingAction, {
      characterId: focusedCharacter.getEntityId(),
      itemId: equipment.entityProperties.id,
      craftingAction: CraftingAction.Repair,
    });
  }

  return (
    <ItemButton
      item={equipment}
      text={equipment.entityProperties.name}
      hotkeyLabel={(listIndex + 1).toString()}
      hotkeys={[`Digit${listIndex + 1}`]}
      clickHandler={clickHandler}
      disabled={false}
    >
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex">
        <div
          className={`w-fit flex pr-2 pl-2 h-8 items-center bg-slate-700 border border-slate-400
            ${durability.current === 0 ? UNMET_REQUIREMENT_TEXT_COLOR : "text-zinc-300"}
            `}
        >
          {durability.current}/{durability.max}
        </div>
        <PriceDisplay
          extraStyles="mr-0"
          price={price}
          shardsOwned={focusedCharacter.combatantProperties.inventory.shards}
        />
      </div>
    </ItemButton>
  );
});
