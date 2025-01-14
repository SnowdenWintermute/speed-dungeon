import React from "react";
import { useGameStore } from "@/stores/game-store";
import selectItem from "@/utils/selectItem";
import {
  CONSUMABLE_TEXT_COLOR,
  CONSUMABLE_TYPE_STRINGS,
  ClientToServerEvent,
  CombatantProperties,
  Consumable,
  Equipment,
  Item,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import setItemHovered from "@/utils/set-item-hovered";
import {
  ItemButtonBody,
  consumableGradientBg,
  unmetRequirementsGradientBg,
} from "../ActionMenu/menu-state/items";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";

interface Props {
  item: Item;
  disabled: boolean;
}

export function takeItem(item: Item) {
  useGameStore.getState().mutateState((gameState) => {
    gameState.hoveredEntity = null;
    gameState.detailedEntity = null;
  });
  websocketConnection.emit(ClientToServerEvent.PickUpItems, {
    characterId: useGameStore.getState().focusedCharacterId,
    itemIds: [item.entityProperties.id],
  });
}

export default function ItemOnGround(props: Props) {
  const { item } = props;
  const gameState = useGameStore();
  function mouseEnterHandler() {
    setItemHovered(item);
  }
  function mouseLeaveHandler() {
    setItemHovered(null);
  }
  function clickHandler() {
    selectItem(item);
  }

  const conditionalClassNames = (() => {
    if (gameState.detailedEntity !== null) {
      if (
        gameState.detailedEntity instanceof Item &&
        gameState.detailedEntity.entityProperties.id === item.entityProperties.id
      )
        return "border-yellow-400 hover:border-t";
    }
    if (gameState.hoveredEntity !== null) {
      if (
        gameState.hoveredEntity instanceof Item &&
        gameState.hoveredEntity.entityProperties.id === item.entityProperties.id
      )
        return "border-white hover:border-t";
    }
    return "";
  })();

  // @TODO - this is dulpicating Item Menu State code, refactor to combine it
  let thumbnailId = "";
  let gradientOverride = "";
  if (item instanceof Consumable) {
    thumbnailId = CONSUMABLE_TYPE_STRINGS[item.consumableType];
    gradientOverride = consumableGradientBg;
  } else {
    thumbnailId = item.entityProperties.id;
  }
  const thumbnailOption = useGameStore.getState().itemThumbnails[thumbnailId];
  const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
  if (focusedCharacterResult instanceof Error) return <></>;
  const requirementsMet = Item.requirementsMet(
    item,
    CombatantProperties.getTotalAttributes(focusedCharacterResult.combatantProperties)
  );

  if (!requirementsMet) {
    gradientOverride = unmetRequirementsGradientBg;
  }

  let imageExtraStyles = "";
  let containerExtraStyles = "pl-2";
  if (!requirementsMet) {
    containerExtraStyles += ` ${UNMET_REQUIREMENT_TEXT_COLOR}`;
    imageExtraStyles += " filter-red";
  } else if (item instanceof Equipment && Equipment.isMagical(item)) {
    containerExtraStyles += " text-blue-300";
  } else if (item instanceof Consumable) {
    containerExtraStyles += ` ${CONSUMABLE_TEXT_COLOR}`;
  }

  return (
    <li
      className={`h-10 w-full max-w-full flex border-r border-l border-b border-slate-400 first:border-t
                      box-border
                      whitespace-nowrap text-ellipsis overflow-hidden cursor-default ${conditionalClassNames}`}
      onMouseEnter={mouseEnterHandler}
      onMouseLeave={mouseLeaveHandler}
    >
      <button
        className="cursor-pointer pr-4 pl-4 box-border
            flex justify-center items-center disabled:opacity-50 disabled:cursor-auto
            border-slate-400 border-r h-full hover:bg-slate-950"
        onClick={() => takeItem(item)}
        onFocus={mouseEnterHandler}
        onBlur={mouseLeaveHandler}
        disabled={props.disabled}
      >
        {"Take"}
      </button>
      <button onClick={clickHandler} className="flex items-center h-full w-full ">
        <ItemButtonBody
          containerExtraStyles={containerExtraStyles}
          thumbnailOption={thumbnailOption}
          gradientOverride={gradientOverride}
          imageExtraStyles="scale-[300%]"
          imageHoverStyles="-translate-x-[55px]"
        >
          {item.entityProperties.name}
        </ItemButtonBody>
      </button>
    </li>
  );
}
