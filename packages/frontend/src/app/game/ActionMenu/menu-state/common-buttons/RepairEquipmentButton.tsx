import { useClientApplication } from "@/hooks/create-client-application-context";
import {
  ClientIntentType,
  CraftingAction,
  Equipment,
  getCraftingActionPrice,
} from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React from "react";
import { ItemButton } from "./ItemButton";
import { PriceDisplay } from "@/app/game/character-sheet/ShardsDisplay";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client-consts";

interface Props {
  equipment: Equipment;
  listIndex: number;
}

export const RepairEquipmentButton = observer((props: Props) => {
  const { equipment, listIndex } = props;
  const clientApplication = useClientApplication();
  const { gameClientRef } = clientApplication;
  const focusedCharacter = clientApplication.combatantFocus.requireFocusedCharacter();

  const price = getCraftingActionPrice(CraftingAction.Repair, equipment);
  const durability = equipment.getDurability();
  if (durability === null) {
    return <div>Indestructable item not shown</div>;
  }

  function clickHandler() {
    gameClientRef.get().dispatchIntent({
      type: ClientIntentType.PerformCraftingAction,
      data: {
        characterId: focusedCharacter.getEntityId(),
        itemId: equipment.getEntityId(),
        craftingAction: CraftingAction.Repair,
      },
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
