import { useGameStore } from "@/stores/game-store";
import {
  CombatantAttributeRecord,
  Equipment,
  EquipmentType,
  Item,
  TaggedEquipmentSlot,
} from "@speed-dungeon/common";
import React, { useMemo } from "react";
import { ConsideringItemMenuState } from "../ActionMenu/menu-state/considering-item";
import { clientUserControlsCombatant } from "@/utils/client-user-controls-combatant";
import isEqual from "lodash.isequal";
import RingIcon from "../../../../public/img/equipment-icons/ring-flattened.svg";
import AmuletIcon from "../../../../public/img/equipment-icons/amulet.svg";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";

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
    const { focusStore } = AppStore.get();

    const { detailedItem, hoveredItem } = focusStore.getFocusedItems();
    const { comparedSlot } = focusStore.getItemComparison();

    const consideredItemUnmetRequirements = focusStore.getSelectedItemUnmetRequirements();

    const focusedCharacterId = useGameStore.getState().focusedCharacterId;
    const playerOwnsCharacter = clientUserControlsCombatant(focusedCharacterId);

    const itemNameDisplay = itemOption ? itemOption.entityProperties.name : "";

    const thumbnailOption = useGameStore().itemThumbnails[itemOption?.entityProperties.id || ""];

    const itemDisplay = thumbnailOption ? (
      <img src={thumbnailOption} className={"max-h-full"} />
    ) : itemOption?.equipmentBaseItemProperties.equipmentType === EquipmentType.Ring ? (
      <RingIcon className="h-full fill-slate-400 " />
    ) : itemOption?.equipmentBaseItemProperties.equipmentType === EquipmentType.Amulet ? (
      <AmuletIcon className="max-w-10 object-contain fill-slate-400 " />
    ) : (
      <div className={itemOption && Equipment.isMagical(itemOption) ? "text-blue-300" : ""}>
        {itemNameDisplay}
      </div>
    );

    const bgStyle = useMemo(() => {
      if (isEqual(comparedSlot, slot))
        if (consideredItemUnmetRequirements !== null) return UNUSABLE_ITEM_BG_STYLES;
        else return USABLE_ITEM_BG_STYLES;
      if (!itemOption) return "";
      if (
        !Item.requirementsMet(itemOption, characterAttributes) ||
        (itemOption instanceof Equipment && Equipment.isBroken(itemOption))
      )
        return UNUSABLE_ITEM_BG_STYLES;
    }, [itemOption, characterAttributes, consideredItemUnmetRequirements, comparedSlot]);

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
      if (itemOption !== null) focusStore.detailable.setHovered(itemOption);
    }

    function handleBlur() {
      focusStore.detailable.clearHovered();
    }

    function handleClick() {
      if (!playerOwnsCharacter) return;
      if (!itemOption) return;

      focusStore.selectItem(itemOption);
      const detailedItemIsNowNull = focusStore.detailable.get().detailed === null;

      const { actionMenuStore } = AppStore.get();
      const currentMenu = actionMenuStore.getCurrentMenu();
      if (currentMenu instanceof ConsideringItemMenuState && detailedItemIsNowNull) {
        return actionMenuStore.popStack();
      }

      if (currentMenu instanceof ConsideringItemMenuState) currentMenu.item = itemOption;
      else
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.push(new ConsideringItemMenuState(itemOption));
        });
    }

    const disabledStyle = playerOwnsCharacter ? "" : "opacity-50";

    return (
      <button
        className={`overflow-ellipsis overflow-hidden border flex items-center justify-center p-2 ${tailwindClasses} ${highlightStyle} ${bgStyle} ${disabledStyle}`}
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
);
