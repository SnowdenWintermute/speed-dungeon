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

const UNUSABLE_ITEM_BG_STYLES = "bg-red-800 opacity-50";

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
  const [bgStyle, setBgStyle] = useState("");
  const bgStyleRef = useRef("");

  useEffect(() => {
    // if not focusing an item, highlight the item in this slot's usability style
    let newBgStyle = "";
    if (comparedSlot === null) {
      if (itemOption && !Item.requirementsMet(itemOption, characterAttributes)) {
        newBgStyle = UNUSABLE_ITEM_BG_STYLES;
      } else newBgStyle = "";
    }
    // if focusing an item, highlight the slot that item would go into with it's usibility style
    else if (comparedSlot === slot) {
      console.log("compared against this slot");
      if (consideredItemUnmetRequirements !== null) newBgStyle = UNUSABLE_ITEM_BG_STYLES;
      else newBgStyle = "bg-slate-800";
    } else newBgStyle = "";

    if (bgStyleRef.current !== newBgStyle) setBgStyle(newBgStyle);
    bgStyleRef.current = newBgStyle;
  }, [itemOption, hoveredEntityOption, detailedEntityOption, characterAttributes, comparedSlot]);

  const highlightStyle = useMemo(() => {
    if (itemOption === null) return `border-slate-400`;
    const itemId = itemOption.entityProperties.id;

    if (detailedEntityOption && itemId === detailedEntityOption.entityProperties.id) {
      return `border-yellow-400`;
    } else if (hoveredEntityOption && itemId === hoveredEntityOption.entityProperties.id) {
      return `border-white`;
    } else return `border-slate-400`;
  }, [detailedEntityOption, hoveredEntityOption, itemOption]);

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
