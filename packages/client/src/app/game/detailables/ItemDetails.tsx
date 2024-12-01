import { SPACING_REM, SPACING_REM_SMALL } from "@/client_consts";
import { CombatActionType, Item, ItemPropertiesType } from "@speed-dungeon/common";
import React, { useRef } from "react";
import ActionDetails from "./ActionDetails";
import EquipmentDetails from "./EquipmentDetails";
import ModKeyTooltip from "./ModKeyTooltip";
import { useGameStore } from "@/stores/game-store";
import Divider from "@/app/components/atoms/Divider";
import Model3DIcon from "../../../../public/img/menu-icons/3d-model-icon.svg";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import getModelAttribution, {
  ARTISTS,
} from "@/app/3d-world/combatant-models/get-model-attribution";

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

  const attribution = itemOption && getModelAttribution(itemOption);

  return (
    <div
      className={`border border-slate-400 bg-slate-700 h-fit
      pointer-events-auto max-w-1/2 ${extraStyles} ${hiddenClass}
      flex relative 
      `}
      style={{
        [`margin${marginSide}`]: `${SPACING_REM_SMALL / 2.0}rem`,
        width: "50%",
        padding: `${SPACING_REM}rem`,
        scrollbarGutter: "stable",
      }}
    >
      {shouldShowModKeyTooltip && isComparedItem && (
        <div className="border border-slate-400 p-2 z-30 absolute -right-4 -top-10 translate-y-1/2 bg-slate-800">
          <ModKeyTooltip />
        </div>
      )}
      <div className="flex-1 justify-center items-center text-center ">
        <span>{itemOption?.entityProperties.name}</span>
        <Divider extraStyles="mr-4" />
        {itemDetailsDisplay}
      </div>
      <div className="self-start flex flex-col">
        <div
          className={`${unmetRequirements ? "filter-red bg-gray-700" : "bg-slate-800"} 
          border border-white w-[7.5rem] h-[12.125rem] max-h-[12.125rem] flex items-center justify-center p-4 mb-1`}
          // className={`bg-slate-700 self-start border border-white w-[7.5rem] h-[12.125rem] max-h-[12.125rem] flex items-center justify-center p-4`}
        >
          <img
            src={thumbnailPath}
            ref={imageRef}
            className="max-h-full object-contain"
            style={{ transform: `rotate(${0}deg)`, objectFit: "contain" }}
          />
        </div>

        {attribution && (
          <HoverableTooltipWrapper
            tooltipText={`3D model by ${attribution.name}`}
            extraStyles="flex items-center justify-center w-full max-w-[7.5rem]"
          >
            <a
              href={attribution.link}
              target="_blank"
              className="text-gray-400 text-sm w-fit text-center align-middle"
            >
              <Model3DIcon className="inline stroke-gray-400 h-4 w-4 mr-1 align-middle" />
              <span className="align-middle">{attribution.name}</span>
            </a>
          </HoverableTooltipWrapper>
        )}
      </div>
    </div>
  );
}
