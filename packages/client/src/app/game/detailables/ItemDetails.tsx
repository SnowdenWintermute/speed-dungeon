import { SPACING_REM, SPACING_REM_SMALL } from "@/client_consts";
import { CombatActionType, Item, ItemPropertiesType } from "@speed-dungeon/common";
import React from "react";
import ActionDetails from "./ActionDetails";
import EquipmentDetails from "./EquipmentDetails";
import ModKeyTooltip from "./ModKeyTooltip";
import { useGameStore } from "@/stores/game-store";
import { className } from "@babylonjs/core";

interface Props {
  title: string;
  shouldShowModKeyTooltip: boolean;
  itemOption: null | Item;
  extraStyles: string;
  marginSide: string;
  isComparedItem: boolean;
}

export const UNMET_REQUIREMENTS_FILTER = "grayscale(1) brightness(0.8) sepia(1) hue-rotate(-90deg)";

export default function ItemDetails({
  title,
  shouldShowModKeyTooltip,
  itemOption,
  extraStyles,
  marginSide,
  isComparedItem,
}: Props) {
  let itemDetailsDisplay = <></>;
  let hiddenClass = "pointer-events-auto";
  let thumbnailPath = "";
  const thumbnailOption = useGameStore().itemThumbnails[itemOption?.entityProperties.id || ""];

  const unmetRequirements = useGameStore().consideredItemUnmetRequirements;

  if (!itemOption) {
    itemDetailsDisplay = <></>;
    hiddenClass = "opacity-0 h-0 pointer-events-none";
  } else {
    const item = itemOption;
    thumbnailPath = thumbnailOption || "img/equipment-icons/1h-sword-a.svg";

    if (item.itemProperties.type === ItemPropertiesType.Consumable) {
      itemDetailsDisplay = (
        <ActionDetails
          combatAction={{ type: CombatActionType.ConsumableUsed, itemId: item.entityProperties.id }}
          hideTitle={true}
        />
      );
    } else {
      itemDetailsDisplay = (
        <EquipmentDetails
          item={item}
          equipmentProperties={item.itemProperties.equipmentProperties}
        />
      );
    }
  }

  return (
    <div
      className={`border border-slate-400 bg-slate-700 h-[13.375rem] max-h-[13.375rem] pointer-events-auto max-w-1/2 relative overflow-y-auto ${extraStyles} ${hiddenClass}`}
      style={{
        [`margin${marginSide}`]: `${SPACING_REM_SMALL / 2.0}rem`,
        width: "50%",
        padding: `${SPACING_REM}rem`,
        scrollbarGutter: "stable",
      }}
    >
      <span className="flex justify-between pr-2">
        {title}
        {shouldShowModKeyTooltip && <ModKeyTooltip />}
      </span>
      <div className="mr-2 mb-1 mt-1 h-[1px] bg-slate-400" />
      {itemOption?.entityProperties.name}
      {itemDetailsDisplay}
      <div className="h-full w-full absolute top-0 left-0 p-2 pr-8 flex items-center justify-end">
        <div
          // style={unmetRequirements?.length ? { filter: UNMET_REQUIREMENTS_FILTER } : {}}
          className="filter-red bg-slate-700 border border-white w-[7.5rem] h-[12.125rem] max-h-[12.125rem] flex items-center justify-center p-4"
        >
          <img src={thumbnailPath} className="max-h-full bg-white" />
        </div>
      </div>
    </div>
  );
}
