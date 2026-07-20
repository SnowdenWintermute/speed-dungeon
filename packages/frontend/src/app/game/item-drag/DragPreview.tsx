import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { DragSourceType } from "@/client-application/item-drag/types";
import { ZIndexLayers } from "@/app/z-index-layers";
import { Consumable, Equipment } from "@speed-dungeon/common";
import { EQUIPMENT_ICONS } from "@/app/game/detailables/EquipmentDetails/equipment-icons";
import { CONSUMABLE_ICONS } from "@/app/icons";

const PREVIEW_SIZE_PX = 64;

export const DragPreview = observer(() => {
  const clientApplication = useClientApplication();
  const { dragService, imageStore } = clientApplication;
  const source = dragService.current;

  // animate from the list's sideways orientation to upright once the drag begins
  const [uprighted, setUprighted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setUprighted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (source === null) {
    return null;
  }

  const item = dragService.getDraggedItem();
  if (item === null) {
    return null;
  }

  const startsSideways =
    source.type === DragSourceType.InventoryItem || source.type === DragSourceType.GroundItem;
  const rotation = startsSideways && !uprighted ? -90 : 0;

  const thumbnail = imageStore.getItemButtonThumbnail(item);

  // when the image hasn't loaded, fall back to the same placeholder SVG the item button uses
  let svgIcon;
  if (!thumbnail && item instanceof Equipment) {
    svgIcon = EQUIPMENT_ICONS[item.equipmentBaseItemProperties.equipmentType](
      "h-full fill-slate-400",
      {}
    );
  } else if (!thumbnail && item instanceof Consumable) {
    const consumableSvgGetter = CONSUMABLE_ICONS[item.consumableType];
    if (consumableSvgGetter !== null) {
      svgIcon = consumableSvgGetter("h-full fill-slate-400");
    }
  }

  const isMagical = item instanceof Equipment && item.isMagical();

  const { x, y } = dragService.pointerPosition;

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left: x,
        top: y,
        // width: PREVIEW_SIZE_PX,
        // height: PREVIEW_SIZE_PX,
        transform: "translate(-50%, -50%)",
        zIndex: ZIndexLayers.Tooltip,
      }}
    >
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-150"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {thumbnail ? (
          <img src={thumbnail} className="max-h-full max-w-full object-contain" draggable={false} />
        ) : svgIcon ? (
          <div style={{ width: PREVIEW_SIZE_PX, height: PREVIEW_SIZE_PX }}>{svgIcon}</div>
        ) : (
          <div
            className={`flex items-center px-2 text-s text-center bg-slate-800 h-10 border border-slate-400 ${
              isMagical ? "text-blue-300" : "text-zinc-200"
            }`}
          >
            {item.entityProperties.name}
          </div>
        )}
      </div>
    </div>
  );
});
