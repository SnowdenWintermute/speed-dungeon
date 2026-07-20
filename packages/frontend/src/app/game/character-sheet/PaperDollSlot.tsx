import {
  CombatantAttributeRecord,
  Equipment,
  EquipmentType,
  Item,
  TaggedEquipmentSlot,
} from "@speed-dungeon/common";
import React, { useMemo } from "react";
import isEqual from "lodash.isequal";
import RingIcon from "../../../../public/img/equipment-icons/ring-flattened.svg";
import AmuletIcon from "../../../../public/img/equipment-icons/amulet.svg";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { ConsideringItemActionMenuScreen } from "@/client-application/action-menu/screens/considering-item";
import { DragSourceType, DropTargetType } from "@/client-application/item-drag/types";
import { useDragSource } from "@/app/game/item-drag/use-drag-source";
import { useDropTarget } from "@/app/game/item-drag/use-drop-target";
import { dropTargetBorderClass } from "@/app/game/item-drag/highlight-styles";
import { DRAG_SOURCE_DRAGGING_OPACITY } from "@/client-consts";

interface Props {
  itemOption: null | Equipment;
  slot: TaggedEquipmentSlot;
  characterAttributes: CombatantAttributeRecord;
  tailwindClasses: string;
}

const UNUSABLE_ITEM_BG_STYLES = "bg-slate-700 filter-red";
const USABLE_ITEM_BG_STYLES = "bg-slate-800";

export const PaperDollSlot = observer(
  ({ itemOption, slot, characterAttributes, tailwindClasses }: Props) => {
    const clientApplication = useClientApplication();
    const { detailableEntityFocus, imageStore, combatantFocus, actionMenu, dragService } =
      clientApplication;

    const { detailedItem, hoveredItem } = detailableEntityFocus.getFocusedItems();
    const { comparedSlot } = detailableEntityFocus.getItemComparison();

    const consideredItemUnmetRequirements =
      detailableEntityFocus.getSelectedItemUnmetRequirements();

    const playerOwnsCharacter = combatantFocus.clientUserControlsFocusedCombatant();

    const canDragFromHere = itemOption !== null && playerOwnsCharacter;
    const dragHandlers = useDragSource(() =>
      canDragFromHere ? { type: DragSourceType.EquippedItem, slot } : null
    );
    const onPointerDown = canDragFromHere ? dragHandlers.onPointerDown : undefined;

    const dropTarget = useDropTarget({ type: DropTargetType.EquipmentSlot, slot });

    const current = dragService.current;
    const isBeingDragged =
      current !== null &&
      current.type === DragSourceType.EquippedItem &&
      current.slot.type === slot.type &&
      current.slot.slot === slot.slot;

    const dragBorderStyle = dropTarget.isDragging
      ? dropTargetBorderClass(dropTarget.resolution, dropTarget.isHovered)
      : null;

    const itemNameDisplay = itemOption ? itemOption.entityProperties.name : "";

    let thumbnailOption = undefined;
    if (itemOption !== null) {
      thumbnailOption = imageStore.getItemThumbnailOption(itemOption.entityProperties.id);
    }

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
      if (isEqual(comparedSlot, slot)) {
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
      if (!playerOwnsCharacter) return;
      if (!itemOption) return;

      detailableEntityFocus.selectItem(itemOption);
      const detailedItemIsNowNull = detailableEntityFocus.detailables.get().detailed === null;

      const currentMenu = actionMenu.getCurrentMenu();
      if (currentMenu instanceof ConsideringItemActionMenuScreen && detailedItemIsNowNull) {
        return actionMenu.popStack();
      }

      if (currentMenu instanceof ConsideringItemActionMenuScreen) {
        currentMenu.item = itemOption;
      } else {
        actionMenu.pushStack(new ConsideringItemActionMenuScreen(clientApplication, itemOption));
      }
    }

    const disabledStyle = playerOwnsCharacter ? "" : "opacity-50";

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
