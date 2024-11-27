import { useGameStore } from "@/stores/game-store";
import selectItem from "@/utils/selectItem";
import setItemHovered from "@/utils/set-item-hovered";
import { CombatantAttributeRecord, EquipmentSlot, Item } from "@speed-dungeon/common";
import React, { useMemo } from "react";
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

  const bgStyle = useMemo(() => {
    // if not focusing an item, highlight the item in this slot's usability style
    // if focusing an item, highlight the slot that item would go into with it's usibility style
    //
    let bgStyles = "";
    let equippedItemIsUsable = true;
    if (itemOption) equippedItemIsUsable = Item.requirementsMet(itemOption, characterAttributes);

    if (!equippedItemIsUsable) {
      console.log("equippedItemIs NOT USABLE");
      bgStyles = UNUSABLE_ITEM_BG_STYLES;
    }

    if (comparedSlot !== null && comparedSlot === slot) {
      if (consideredItemUnmetRequirements !== null) bgStyles = UNUSABLE_ITEM_BG_STYLES;
      else bgStyles = "bg-slate-800";
    }

    return bgStyles;
  }, [detailedEntityOption, hoveredEntityOption, itemOption, comparedSlot, characterAttributes]);

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
