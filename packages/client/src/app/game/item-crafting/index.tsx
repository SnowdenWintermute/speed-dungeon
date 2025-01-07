import { useGameStore } from "@/stores/game-store";
import React from "react";
import { CraftingItemMenuState } from "../ActionMenu/menu-state/crafting-item";
import ItemDetails from "../detailables/ItemDetails";
import Divider from "@/app/components/atoms/Divider";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";

export default function ItemCraftDisplay() {
  const currentMenu = useGameStore.getState().getCurrentMenu();
  const partyResult = useGameStore.getState().getParty();
  if (!(currentMenu instanceof CraftingItemMenuState) || partyResult instanceof Error) {
    return <></>;
  }

  const equipment = currentMenu.item;

  const ilvlLimited = equipment.itemLevel > partyResult.currentFloor;

  return (
    <section className="flex-1 flex items-end h-full">
      <div className="border border-slate-400 p-4 bg-slate-700 h-full w-fit pointer-events-auto">
        <h3 className="text-lg mb-4 ">Modifying item:</h3>
        <ItemDetails
          itemOption={equipment}
          shouldShowModKeyTooltip={false}
          extraStyles={"min-w-[500px] mb-4"}
          marginSide={"0px"}
          isComparedItem={false}
        />
        <Divider />
        <div className="w-[500px]">
          <p className="mb-2">
            Note: A crafting action can not generate an affix of a tier which is higher than the
            item's level or the current floor, whichever is lower.
          </p>
          <p>Item level: {equipment.itemLevel}</p>
          <p>Dungeon level: {partyResult.currentFloor}</p>
          <p className={ilvlLimited ? UNMET_REQUIREMENT_TEXT_COLOR : ""}>
            Effective item level: {Math.min(equipment.itemLevel, partyResult.currentFloor)}
          </p>
        </div>
      </div>
    </section>
  );
}
