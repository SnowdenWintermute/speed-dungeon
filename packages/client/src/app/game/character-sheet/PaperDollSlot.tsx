import { useGameStore } from "@/stores/game-store";
import { DetailableEntity, DetailableEntityType } from "@/stores/game-store/detailable-entities";
import selectItem from "@/utils/selectItem";
import setItemHovered from "@/utils/set-item-hovered";
import { CombatantAttributeRecord, EquipmentSlot, Item } from "@speed-dungeon/common";
import React, { useEffect, useState } from "react";

interface Props {
  itemOption: null | Item;
  slot: EquipmentSlot;
  characterAttributes: CombatantAttributeRecord;
  tailwindClasses: string;
}

const UNUSABLE_ITEM_BG_STYLES = "bg-red-800 opacity-50";

export default function PaperDollSlot({
  itemOption,
  slot,
  characterAttributes,
  tailwindClasses,
}: Props) {
  const [highlightStyle, setHighlightStyle] = useState("border-slate-400");
  const mutateGameState = useGameStore().mutateState;
  const detailedEntityOption = useGameStore().detailedEntity;
  const hoveredEntityOption = useGameStore().hoveredEntity;
  const comparedSlot = useGameStore().comparedSlot;
  const consideredItemUnmetRequirements = useGameStore().consideredItemUnmetRequirements;

  const itemNameDisplay = itemOption ? itemOption.entityProperties.name : "";

  useEffect(() => {
    let bgStyles = "";
    let equippedItemIsUsable = true;
    if (itemOption) equippedItemIsUsable = Item.requirementsMet(itemOption, characterAttributes);
    if (!equippedItemIsUsable) bgStyles = UNUSABLE_ITEM_BG_STYLES;
    if (comparedSlot !== null) {
      if (comparedSlot === slot) {
        if (consideredItemUnmetRequirements !== null) bgStyles = UNUSABLE_ITEM_BG_STYLES;
        else bgStyles = "bg-slate-800";
      }
    }

    determineAndSetHighlightStyle(
      detailedEntityOption,
      hoveredEntityOption,
      itemOption,
      setHighlightStyle
    );
  }, [detailedEntityOption, hoveredEntityOption, itemOption, comparedSlot, characterAttributes]);

  function handleMouseEnter() {
    setItemHovered(mutateGameState, itemOption);
  }
  function handleMouseLeave() {
    setItemHovered(mutateGameState, null);
  }
  function handleFocus() {
    setItemHovered(mutateGameState, itemOption);
  }
  function handleBlur() {
    setItemHovered(mutateGameState, null);
  }
  function handleClick() {
    selectItem(mutateGameState, itemOption);
  }

  return (
    <button
      className={`overflow-ellipsis overflow-hidden border ${tailwindClasses} ${highlightStyle}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
    >
      {itemNameDisplay}
    </button>
  );
}

function determineAndSetHighlightStyle(
  detailedEntityOption: null | DetailableEntity,
  hoveredEntityOption: null | DetailableEntity,
  itemOption: null | Item,
  setHighlightStyle: (style: string) => void
) {
  if (
    detailedEntityOption !== null &&
    detailedEntityOption.type === DetailableEntityType.Item &&
    itemOption !== null
  ) {
    if (itemOption.entityProperties.id === detailedEntityOption.item.entityProperties.id) {
      setHighlightStyle(`border-yellow-400`);
      return;
    }
  }
  if (
    hoveredEntityOption !== null &&
    hoveredEntityOption.type === DetailableEntityType.Item &&
    itemOption !== null
  ) {
    if (itemOption.entityProperties.id === hoveredEntityOption.item.entityProperties.id) {
      setHighlightStyle(`border-white`);
      return;
    }
  }

  setHighlightStyle(`border-slate-400`);
}
