import { SPACING_REM, SPACING_REM_SMALL } from "@/client_consts";
import { CombatActionType, Item, ItemPropertiesType } from "@speed-dungeon/common";
import React from "react";
import ActionDetails from "./ActionDetails";

interface Props {
  title: string;
  shouldShowModKeyTooltip: boolean;
  item: Item;
  extraStyles: string;
  marginSide: string;
}

export default function ItemDetails({
  title,
  shouldShowModKeyTooltip,
  item,
  extraStyles,
  marginSide,
}: Props) {
  let itemDetailsDisplay = <></>;

  if (item.itemProperties.type === ItemPropertiesType.Consumable) {
    itemDetailsDisplay = (
      <ActionDetails
        combatAction={{ type: CombatActionType.ConsumableUsed, itemId: item.entityProperties.id }}
        hideTitle={true}
      />
    );
  } else {
    // item.itemProperties.equipmentProperties
  }

  return (
    <div
      className={`border border-slate-400 bg-slate-700 h-[13.375rem] max-h-[13.375rem] pointer-events-auto max-w-1/2 relative overflow-y-auto ${extraStyles}`}
      style={{
        [`margin${marginSide}`]: `${SPACING_REM_SMALL / 2.0}rem`,
        width: "50%",
        padding: `${SPACING_REM}rem`,
        scrollbarGutter: "stable",
      }}
    >
      <span className="flex justify-between pr-2">
        {title}
        {
          // mod_key_tooltip
        }
      </span>
      <div className="mr-2 mb-1 mt-1 h-[1px] bg-slate-400" />
      {item.entityProperties.name}
      {
        // item_details_display
      }
      <div className="opacity-50 fill-slate-400 h-40 absolute bottom-5 right-3">
        <img src="public/img/equipment-icons/1h-sword-a.svg" className="h-40 filter" />
      </div>
    </div>
  );
}