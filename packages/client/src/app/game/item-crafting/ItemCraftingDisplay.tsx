import { useGameStore } from "@/stores/game-store";
import React from "react";
import { CraftingItemMenuState } from "../ActionMenu/menu-state/crafting-item";
import ItemDetails from "../detailables/ItemDetails";
import Divider from "@/app/components/atoms/Divider";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { INFO_UNICODE_SYMBOL } from "@speed-dungeon/common";

export default function ItemCraftDisplay() {
  const currentMenu = useGameStore.getState().getCurrentMenu();
  const partyResult = useGameStore.getState().getParty();
  if (!(currentMenu instanceof CraftingItemMenuState) || partyResult instanceof Error) {
    return <></>;
  }

  const equipment = currentMenu.item;

  const ilvlLimited = equipment.itemLevel > partyResult.currentFloor;

  return (
    <section className="flex-1 flex items-end">
      <div className="border border-slate-400 p-4 bg-slate-700 h-full w-fit pointer-events-auto">
        <ItemDetails
          itemOption={equipment}
          shouldShowModKeyTooltip={false}
          extraStyles={"min-w-[500px] mb-4"}
          marginSide={"0px"}
          isComparedItem={false}
        />
        <Divider />
        <div className="w-[500px]">
          <p>Item level: {equipment.itemLevel}</p>
          <p>Dungeon level: {partyResult.currentFloor}</p>
          <p className={ilvlLimited ? UNMET_REQUIREMENT_TEXT_COLOR : ""}>
            <HoverableTooltipWrapper
              extraStyles="inline"
              tooltipText={`
          Note: A crafting action can not generate an affix of a tier which is higher than the
            item's level or the current floor, whichever is lower. For this reason, the "Shake"
            action is not permitted unless the machine's level is at least as high as the item
            level. Take care - "Tumble" may replace higher tier affixes with affixes that are limited by this rule.
            `}
            >
              {INFO_UNICODE_SYMBOL}
            </HoverableTooltipWrapper>{" "}
            Effective item level: {Math.min(equipment.itemLevel, partyResult.currentFloor)}
          </p>
        </div>
      </div>
    </section>
  );
}
