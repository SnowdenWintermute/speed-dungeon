import { SPACING_REM, SPACING_REM_SMALL } from "@/client_consts";
import {
  CONSUMABLE_ACTION_NAMES_BY_CONSUMABLE_TYPE,
  CONSUMABLE_DESCRIPTIONS,
  CONSUMABLE_TYPE_STRINGS,
  Consumable,
  ConsumableType,
  EntityProperties,
  Equipment,
  Item,
} from "@speed-dungeon/common";
import React, { useEffect, useRef, useState } from "react";
import ActionDetails from "./action-details";
import EquipmentDetails from "./EquipmentDetails";
import ModKeyTooltip from "./ModKeyTooltip";
import { useGameStore } from "@/stores/game-store";
import Divider from "@/app/components/atoms/Divider";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { ZIndexLayers } from "@/app/z-index-layers";
import { getModelAttribution } from "@/app/3d-world/item-models/get-model-attribution";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { HOTKEYS } from "@/hotkeys";
import domtoimage from "dom-to-image";
import { EQUIPMENT_ICONS } from "./EquipmentDetails/equipment-icons";
import { IconName, SVG_ICONS } from "@/app/icons";
import { AppStore } from "@/mobx-stores/app-store";
import { observer } from "mobx-react-lite";

interface Props {
  shouldShowModKeyTooltip: boolean;
  itemOption: null | Item;
  extraStyles: string;
  marginSide: string;
  isComparedItem: boolean;
}

export const UNMET_REQUIREMENTS_FILTER = "grayscale(1) brightness(0.8) sepia(1) hue-rotate(-90deg)";

export const ItemDetails = observer(
  ({ shouldShowModKeyTooltip, itemOption, extraStyles, marginSide, isComparedItem }: Props) => {
    let itemDetailsDisplay = <></>;
    const imageRef = useRef<HTMLImageElement>(null);
    let hiddenClass = "pointer-events-auto";
    let thumbnailPath = "";
    let svgThumbnailOption = undefined;

    const [preppedForDownloadPhoto, setPreppedForDownloadPhoto] = useState<{
      entityProperties: EntityProperties;
      ilvl: number;
    } | null>(null);

    async function handleDownload(entityProperties: EntityProperties, ilvl: number) {
      await new Promise((resolve, reject) => {
        const { id, name } = entityProperties;
        const node = document.getElementById(id);
        if (!node) return;

        setTimeout(() => {
          domtoimage.toBlob(node).then((blob) => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `Speed Dungeon Item - ${name} ilvl ${ilvl}.png`;
            link.click();
            resolve(true);
          });
        }, 0);
      });
    }

    async function downloadItemImage(entityProperties: EntityProperties, ilvl: number) {
      setPreppedForDownloadPhoto({ entityProperties, ilvl });
    }

    // idk if this is really required, but the idea was it needed to paint the frame with the updated state
    // before taking the image, but now that we use a setTimeout in handleDownload it might not matter
    useEffect(() => {
      if (preppedForDownloadPhoto) {
        const { entityProperties, ilvl } = preppedForDownloadPhoto;
        handleDownload(entityProperties, ilvl).then(() => {
          setPreppedForDownloadPhoto(null);
        });
      }
    }, [preppedForDownloadPhoto]);

    const { focusStore } = AppStore.get();
    const unmetRequirements = focusStore.getSelectedItemUnmetRequirements();
    let BG_COLOR = "bg-slate-800";

    let thumbnailIdOption = "";

    const isDetailedEntity =
      itemOption && focusStore.entityIsDetailed(itemOption.entityProperties.id);
    const isHoveredEntity =
      itemOption && focusStore.entityIsHovered(itemOption.entityProperties.id);

    if (!itemOption) {
      itemDetailsDisplay = <></>;
      hiddenClass = "opacity-0 h-0 pointer-events-none";
    } else {
      const item = itemOption;
      hiddenClass = "pointer-events-auto ";

      if (item instanceof Equipment) {
        itemDetailsDisplay = <EquipmentDetails equipment={item} />;
        thumbnailIdOption = item.entityProperties.id;
        svgThumbnailOption = EQUIPMENT_ICONS[item.equipmentBaseItemProperties.equipmentType](
          "fill-slate-400",
          {}
        );
      } else if (item instanceof Consumable) {
        BG_COLOR = "bg-slate-700";
        thumbnailIdOption = CONSUMABLE_TYPE_STRINGS[item.consumableType];
        if (item.consumableType === ConsumableType.StackOfShards) {
          svgThumbnailOption = SVG_ICONS[IconName.Shards]("h-full fill-slate-400 m-2");
          itemDetailsDisplay = <div>Could be useful...</div>;
        } else {
          if (Consumable.isSkillBook(item.consumableType)) {
            svgThumbnailOption = SVG_ICONS[IconName.Book]("h-full fill-slate-400 m-2");
          }
          const actionNameOption = CONSUMABLE_ACTION_NAMES_BY_CONSUMABLE_TYPE[item.consumableType];
          if (actionNameOption === null)
            itemDetailsDisplay = (
              <div>
                Consumable action not implemented {CONSUMABLE_TYPE_STRINGS[item.consumableType]}
              </div>
            );
          else {
            const consumableDescription = CONSUMABLE_DESCRIPTIONS[item.consumableType];
            itemDetailsDisplay = (
              <ActionDetails
                actionName={actionNameOption}
                hideTitle={true}
                consumableDescriptionOption={consumableDescription}
              />
            );
          }
        }
      } else {
        itemDetailsDisplay = <div>unknown item type</div>;
      }
    }

    const thumbnailOption = AppStore.get().imageStore.getItemThumbnailOption(thumbnailIdOption);
    if (!thumbnailPath && thumbnailOption) thumbnailPath = thumbnailOption;
    if (!thumbnailPath && !svgThumbnailOption)
      svgThumbnailOption = SVG_ICONS[IconName.Sword]("h-full fill-slate-950");

    const attribution = itemOption && getModelAttribution(itemOption);

    return (
      <div
        className={`border ${isDetailedEntity ? "border-yellow-400" : isHoveredEntity ? "border-white" : "border-slate-400"} bg-slate-700 h-fit
      w-full ${extraStyles} ${hiddenClass}
      flex relative 
      `}
        id={itemOption?.entityProperties.id}
        style={{
          [`margin${marginSide}`]: `${SPACING_REM_SMALL / 2.0}rem`,
          padding: `${SPACING_REM}rem`,
          scrollbarGutter: "stable",
        }}
      >
        {isDetailedEntity && !preppedForDownloadPhoto && (
          <div className="absolute z-20 -right-1 -top-1 flex flex-col">
            <HotkeyButton
              className="z-10 h-6 w-6 p-1 border border-slate-400 bg-slate-700"
              hotkeys={[HOTKEYS.CANCEL]}
              onClick={() => {
                focusStore.detailable.clearDetailed();
              }}
            >
              {SVG_ICONS[IconName.XShape]("h-full fill-slate-400")}
            </HotkeyButton>
            {itemOption && (
              <HoverableTooltipWrapper tooltipText="Download image" extraStyles="mt-2">
                <button
                  onClick={() =>
                    downloadItemImage(itemOption.entityProperties, itemOption.itemLevel)
                  }
                  className="border border-slate-400 bg-slate-700 h-6 w-6 p-1"
                >
                  {SVG_ICONS[IconName.Camera]("h-full max-w-full fill-slate-400")}
                </button>
              </HoverableTooltipWrapper>
            )}
          </div>
        )}
        {itemOption instanceof Equipment && (
          <div
            className={`absolute ${preppedForDownloadPhoto ? "top-3 left-3" : "-top-1 -left-1"} z-10 `}
          >
            <HoverableTooltipWrapper
              extraStyles="cursor-help"
              tooltipText="Item Level (determines possible affix tiers) "
            >
              <span className="bg-slate-800 h-6 w-6 border border-slate-400 flex justify-center items-center">
                {itemOption.itemLevel}
              </span>
            </HoverableTooltipWrapper>
          </div>
        )}
        {shouldShowModKeyTooltip && isComparedItem && (
          <div
            style={{ zIndex: ZIndexLayers.ItemDetails }}
            className={`border border-slate-400 p-2 absolute -right-4 -top-10 translate-y-1/2 bg-slate-800`}
          >
            <ModKeyTooltip />
          </div>
        )}
        <div className="flex-1 justify-center items-center text-center ">
          <span
            className={`pr-2 ${itemOption instanceof Equipment && Equipment.isMagical(itemOption) && "text-blue-300"}`}
          >
            {itemOption?.entityProperties.name}
          </span>
          <Divider extraStyles="mr-4" />
          {itemDetailsDisplay}
        </div>
        <div className="self-start flex flex-col">
          <div
            className={`${unmetRequirements ? "filter-red bg-gray-700" : BG_COLOR} 
          border border-white w-[7.5rem] h-[12.125rem] max-h-[12.125rem] flex items-center justify-center p-4 mb-1`}
            // className={`bg-slate-700 self-start border border-white w-[7.5rem] h-[12.125rem] max-h-[12.125rem] flex items-center justify-center p-4`}
          >
            {thumbnailPath ? (
              <img
                src={thumbnailPath}
                ref={imageRef}
                className="max-h-full object-contain"
                style={{ transform: `rotate(${0}deg)`, objectFit: "contain" }}
              />
            ) : svgThumbnailOption ? (
              svgThumbnailOption
            ) : (
              <></>
            )}
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
                {SVG_ICONS[IconName.Model3DIcon](
                  "inline stroke-gray-400 h-4 w-4 mr-1 align-middle"
                )}
                <span className="align-middle">{attribution.name}</span>
              </a>
            </HoverableTooltipWrapper>
          )}
        </div>
      </div>
    );
  }
);
