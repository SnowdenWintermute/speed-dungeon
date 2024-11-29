import { useGameStore } from "@/stores/game-store";
import selectItem from "@/utils/selectItem";
import setItemHovered from "@/utils/set-item-hovered";
import { CombatantAttributeRecord, EquipmentSlot, Item } from "@speed-dungeon/common";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ConsideringItemMenuState } from "../ActionMenu/menu-state/considering-item";
import clientUserControlsCombatant from "@/utils/client-user-controls-combatant";

interface Props {
  itemOption: null | Item;
  slot: EquipmentSlot;
  characterAttributes: CombatantAttributeRecord;
  tailwindClasses: string;
}

const UNUSABLE_ITEM_BG_STYLES = "bg-slate-700 filter-red";
const USABLE_ITEM_BG_STYLES = "bg-slate-800";

export default function PaperDollSlot({
  itemOption,
  slot,
  characterAttributes,
  tailwindClasses,
}: Props) {
  const detailedEntityOption = useGameStore().detailedEntity;
  const hoveredEntityOption = useGameStore().hoveredEntity;
  const comparedSlot = useGameStore().comparedSlot;
  const consideredItemUnmetRequirements = useGameStore().consideredItemUnmetRequirements;

  const focusedCharacterId = useGameStore.getState().focusedCharacterId;
  const playerOwnsCharacter = clientUserControlsCombatant(focusedCharacterId);

  const itemNameDisplay = itemOption ? itemOption.entityProperties.name : "";

  const thumbnailOption = useGameStore().itemThumbnails[itemOption?.entityProperties.id || ""];

  const itemDisplay = thumbnailOption ? (
    <img src={thumbnailOption} className={"max-h-full"} />
  ) : (
    itemNameDisplay
  );

  const bgStyle = useMemo(() => {
    if (comparedSlot === slot)
      if (consideredItemUnmetRequirements !== null) return UNUSABLE_ITEM_BG_STYLES;
      else return USABLE_ITEM_BG_STYLES;
    if (!itemOption) return "";
    if (!Item.requirementsMet(itemOption, characterAttributes)) return UNUSABLE_ITEM_BG_STYLES;
  }, [itemOption, characterAttributes, consideredItemUnmetRequirements, comparedSlot]);

  const highlightStyle = useMemo(() => {
    if (itemOption === null) return `border-slate-400`;
    const itemId = itemOption.entityProperties.id;

    if (detailedEntityOption && itemId === detailedEntityOption.entityProperties.id) {
      return `border-yellow-400`;
    } else if (hoveredEntityOption && itemId === hoveredEntityOption.entityProperties.id) {
      return `border-white`;
    } else return `border-slate-400`;
  }, [detailedEntityOption, hoveredEntityOption, itemOption]);

  function handleFocus() {
    setItemHovered(itemOption);
  }
  function handleBlur() {
    setItemHovered(null);
  }

  function handleClick() {
    if (!playerOwnsCharacter) return;
    if (!itemOption) return;

    const detailedItemIsNowNull = selectItem(itemOption);

    const currentMenu = useGameStore.getState().getCurrentMenu();
    if (currentMenu instanceof ConsideringItemMenuState && detailedItemIsNowNull)
      return useGameStore.getState().mutateState((state) => {
        state.stackedMenuStates.pop();
      });

    if (currentMenu instanceof ConsideringItemMenuState) currentMenu.item = itemOption;
    else
      useGameStore.getState().mutateState((state) => {
        state.stackedMenuStates.push(new ConsideringItemMenuState(itemOption));
      });
  }

  const disabledStyle = playerOwnsCharacter ? "" : "opacity-50";

  return (
    <button
      className={`overflow-ellipsis overflow-hidden border flex items-center justify-center p-4 ${tailwindClasses} ${highlightStyle} ${bgStyle} ${disabledStyle}`}
      onMouseEnter={handleFocus}
      onMouseLeave={handleBlur}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
    >
      {itemDisplay}
    </button>
  );
}
