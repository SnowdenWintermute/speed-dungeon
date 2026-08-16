import {
  CombatantAttributeRecord,
  Equipment,
  EquipmentSlotId,
  EquipmentType,
  Item,
} from "@speed-dungeon/common";
import React, { useMemo } from "react";
import RingIcon from "../../../../public/img/equipment-icons/ring-flattened.svg";
import AmuletIcon from "../../../../public/img/equipment-icons/amulet.svg";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { useCharacterSheetSubject } from "./character-sheet-subject-context";
import { DragSourceType, DropTargetType } from "@/client-application/item-drag/types";
import { useDragSource } from "@/app/game/item-drag/use-drag-source";
import { useDropTarget } from "@/app/game/item-drag/use-drop-target";
import { dropTargetBorderClass } from "@/app/game/item-drag/highlight-styles";
import { DRAG_SOURCE_DRAGGING_OPACITY } from "@/client-consts";
import { useItemThumbnail } from "@/hooks/use-item-thumbnail";

interface Props {
  itemOption: null | Equipment;
  slotId: EquipmentSlotId;
  characterAttributes: CombatantAttributeRecord;
  tailwindClasses: string;
}

const UNUSABLE_ITEM_BG_STYLES = "bg-slate-700 filter-red";
const USABLE_ITEM_BG_STYLES = "bg-slate-800";

export const PaperDollSlot = observer(
  ({ itemOption, slotId, characterAttributes, tailwindClasses }: Props) => {
    const clientApplication = useClientApplication();
    const { detailableEntityFocus, dragService } = clientApplication;
    const thumbnailOption = useItemThumbnail(itemOption);
    const subject = useCharacterSheetSubject();

    const { detailedItem, hoveredItem } = detailableEntityFocus.getFocusedItems();
    const { comparedSlotId } = detailableEntityFocus.getItemComparison();

    const consideredItemUnmetRequirements = detailableEntityFocus.getSelectedItemUnmetRequirements(
      subject.combatant
    );

    const clickHandlerOption = subject.getEquipmentSlotClickHandlerOption();

    const canDragFromHere = itemOption !== null && subject.getEquipmentIsDraggable();
    const dragHandlers = useDragSource(() =>
      canDragFromHere ? { type: DragSourceType.EquippedItem, slotId } : null
    );
    const onPointerDown = canDragFromHere ? dragHandlers.onPointerDown : undefined;

    const dropTarget = useDropTarget({ type: DropTargetType.EquipmentSlot, slotId });

    const current = dragService.current;
    const isBeingDragged =
      current !== null && current.type === DragSourceType.EquippedItem && current.slotId === slotId;

    const dragBorderStyle = dropTarget.isDragging
      ? dropTargetBorderClass(dropTarget.resolution, dropTarget.isHovered)
      : null;

    const itemNameDisplay = itemOption ? itemOption.entityProperties.name : "";

    const itemDisplay = thumbnailOption ? (
      <img src={thumbnailOption} className={"max-h-full"} draggable={false} />
    ) : itemOption?.equipmentBaseItemProperties.equipmentType === EquipmentType.Ring ? (
      <RingIcon className="h-full fill-slate-400 " />
    ) : itemOption?.equipmentBaseItemProperties.equipmentType === EquipmentType.Amulet ? (
      <AmuletIcon className="max-w-10 object-contain fill-slate-400 " />
    ) : (
      <div className={itemOption && itemOption.isMagical() ? "text-blue-300" : ""}>
        {itemNameDisplay}
      </div>
    );

    const bgStyle = (() => {
      if (comparedSlotId === slotId) {
        if (consideredItemUnmetRequirements.size) {
          return UNUSABLE_ITEM_BG_STYLES;
        } else {
          return USABLE_ITEM_BG_STYLES;
        }
      }
      if (!itemOption) {
        return "";
      }
      if (
        !Item.requirementsMet(itemOption, characterAttributes) ||
        (itemOption instanceof Equipment && itemOption.isBroken())
      ) {
        return UNUSABLE_ITEM_BG_STYLES;
      }
    })();

    const highlightStyle = useMemo(() => {
      if (itemOption === null) return `border-slate-400`;
      const itemId = itemOption.entityProperties.id;

      if (detailedItem && itemId === detailedItem.entityProperties.id) {
        return `border-yellow-400`;
      } else if (hoveredItem && itemId === hoveredItem.entityProperties.id) {
        return `border-white`;
      } else return `border-slate-400`;
    }, [detailedItem, hoveredItem, itemOption]);

    function handleFocus() {
      if (itemOption !== null) detailableEntityFocus.detailables.setHovered(itemOption);
    }

    function handleBlur() {
      detailableEntityFocus.detailables.clearHovered();
    }

    function handleClick() {
      if (clickHandlerOption === null) return;
      if (!itemOption) return;

      clickHandlerOption(itemOption);
    }

    const disabledStyle = subject.getIsUnownedInPlay() ? "opacity-50" : "";

    return (
      <button
        className={`overflow-ellipsis overflow-hidden border flex items-center justify-center p-2 ${tailwindClasses} ${dragBorderStyle ?? highlightStyle} ${bgStyle} ${disabledStyle}`}
        style={isBeingDragged ? { opacity: DRAG_SOURCE_DRAGGING_OPACITY } : undefined}
        onMouseEnter={handleFocus}
        onMouseLeave={handleBlur}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        onPointerDown={onPointerDown}
        onPointerEnter={dropTarget.onPointerEnter}
        onPointerLeave={dropTarget.onPointerLeave}
      >
        {itemDisplay}
      </button>
    );
  }
);
