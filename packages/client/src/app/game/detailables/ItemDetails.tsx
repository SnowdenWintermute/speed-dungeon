import { SPACING_REM, SPACING_REM_SMALL } from "@/client_consts";
import { CombatActionType, Item, ItemPropertiesType } from "@speed-dungeon/common";
import React, { useEffect, useMemo, useRef } from "react";
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
  const imageRef = useRef<HTMLImageElement>(null);
  let hiddenClass = "pointer-events-auto";
  let thumbnailPath = "";
  const thumbnailOption = useGameStore().itemThumbnails[itemOption?.entityProperties.id || ""];

  const unmetRequirements = useGameStore().consideredItemUnmetRequirements;

  const angle = useMemo(() => {
    return ((Math.atan(7.5 / 12.125) * 180) / Math.PI) * -1 + Math.PI * 2;
  }, [thumbnailPath]);

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
      className={`border border-slate-400 bg-slate-700 h-fit
      pointer-events-auto max-w-1/2 relative overflow-y-auto ${extraStyles} ${hiddenClass}
      flex items-center
      `}
      style={{
        [`margin${marginSide}`]: `${SPACING_REM_SMALL / 2.0}rem`,
        width: "50%",
        padding: `${SPACING_REM}rem`,
        scrollbarGutter: "stable",
      }}
    >
      <div className="flex-1 justify-center items-center text-center">
        {
          // <span className="flex justify-between pr-2">
          // {title}
          // {shouldShowModKeyTooltip && <ModKeyTooltip />}
          // </span>
          // <div className="mr-2 mb-1 mt-1 h-[1px] bg-slate-400" />
        }
        <span>{itemOption?.entityProperties.name}</span>
        {itemDetailsDisplay}
      </div>
      <div
        className={`${unmetRequirements ? "filter-red bg-gray-700" : "bg-slate-700"}  border border-white w-[7.5rem] h-[12.125rem] max-h-[12.125rem] flex items-center justify-center p-4`}
        // className={`${unmetRequirements ? "" : "bg-slate-700"}  border border-white w-[7.5rem] h-[12.125rem] max-h-[12.125rem] flex items-center justify-center p-4`}
      >
        <img
          src={thumbnailPath}
          ref={imageRef}
          className="max-h-full object-contain"
          style={{ transform: `rotate(${0}deg)`, objectFit: "contain" }}
        />
      </div>
    </div>
  );
}
