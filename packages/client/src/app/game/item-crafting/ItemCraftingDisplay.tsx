import React from "react";
import { CraftingItemMenuState } from "../ActionMenu/menu-state/crafting-item";
import { ItemDetails } from "../detailables/ItemDetails";
import Divider from "@/app/components/atoms/Divider";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { INFO_UNICODE_SYMBOL } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";

export const ItemCraftDisplay = observer(() => {
  const { focusStore, actionMenuStore } = AppStore.get();
  const currentMenu = actionMenuStore.getCurrentMenu();
  const { hovered: hoveredEntity } = focusStore.detailable.get();

  if (!(currentMenu instanceof CraftingItemMenuState) || hoveredEntity) {
    return <></>;
  }

  const equipment = currentMenu.item;

  const party = AppStore.get().gameStore.getExpectedParty();
  const currentFloor = party.dungeonExplorationManager.getCurrentFloor();

  const ilvlLimited = equipment.itemLevel > currentFloor;

  return (
    <section className="flex-1 flex items-end">
      <div className="border border-slate-400 p-4 bg-slate-800 h-full w-fit pointer-events-auto">
        <ItemDetails
          itemOption={equipment}
          shouldShowModKeyTooltip={false}
          extraStyles={"min-w-[500px] mb-4"}
          marginSide={"0px"}
          isComparedItem={false}
        />
        <Divider />
        <div className="w-[500px] text-slate-400">
          <p>Item level: {equipment.itemLevel}</p>
          <p>Dungeon level: {currentFloor}</p>
          <div className={ilvlLimited ? UNMET_REQUIREMENT_TEXT_COLOR : ""}>
            <HoverableTooltipWrapper
              extraStyles="inline cursor-help"
              tooltipText={`
            A crafting action can not generate an affix of a tier which is higher than the
            item's level or the current floor, whichever is lower. For this reason, the "Shake"
            action is not permitted unless the machine's level is at least as high as the item
            level. Take care - "Tumble" may replace higher tier affixes with affixes that are limited by this rule.
            `}
            >
              {INFO_UNICODE_SYMBOL}
            </HoverableTooltipWrapper>{" "}
            Effective item level: {Math.min(equipment.itemLevel, currentFloor)}
          </div>
        </div>
      </div>
    </section>
  );
});
