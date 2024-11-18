import { getCurrentMenu, useGameStore } from "@/stores/game-store";
import selectItem from "@/utils/selectItem";
import setItemHovered from "@/utils/set-item-hovered";
import {
  AdventuringParty,
  Combatant,
  CombatantAttributeRecord,
  ERROR_MESSAGES,
  EquipmentSlot,
  Item,
} from "@speed-dungeon/common";
import React, { useEffect, useState } from "react";
import { MenuStateType } from "../ActionMenu/menu-state";
import { ConsideringItemMenuState } from "../ActionMenu/menu-state/considering-item";
import clientUserControlsCombatant from "@/utils/client-user-controls-combatant";

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
  const [bgStyle, setBgStyle] = useState("");
  const detailedEntityOption = useGameStore().detailedEntity;
  const hoveredEntityOption = useGameStore().hoveredEntity;
  const comparedSlot = useGameStore().comparedSlot;
  const consideredItemUnmetRequirements = useGameStore().consideredItemUnmetRequirements;

  const focusedCharacterId = useGameStore.getState().focusedCharacterId;
  const playerOwnsCharacter = clientUserControlsCombatant(focusedCharacterId);

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
    setBgStyle(bgStyles);

    determineAndSetHighlightStyle(
      detailedEntityOption,
      hoveredEntityOption,
      itemOption,
      setHighlightStyle
    );
  }, [detailedEntityOption, hoveredEntityOption, itemOption, comparedSlot, characterAttributes]);

  function handleMouseEnter() {
    setItemHovered(itemOption);
  }
  function handleMouseLeave() {
    setItemHovered(null);
  }
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
      className={`overflow-ellipsis overflow-hidden border ${tailwindClasses} ${highlightStyle} ${bgStyle} ${disabledStyle}`}
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
  detailedEntityOption: null | Item | Combatant,
  hoveredEntityOption: null | Item | Combatant,
  itemOption: null | Item,
  setHighlightStyle: (style: string) => void
) {
  if (detailedEntityOption instanceof Item && itemOption !== null) {
    if (itemOption.entityProperties.id === detailedEntityOption.entityProperties.id) {
      setHighlightStyle(`border-yellow-400`);
      return;
    }
  }
  if (hoveredEntityOption instanceof Item && itemOption !== null) {
    if (itemOption.entityProperties.id === hoveredEntityOption.entityProperties.id) {
      setHighlightStyle(`border-white`);
      return;
    }
  }

  setHighlightStyle(`border-slate-400`);
}
