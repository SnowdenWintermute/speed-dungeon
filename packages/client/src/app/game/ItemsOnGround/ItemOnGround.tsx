import React from "react";
import { useGameStore } from "@/stores/game-store";
import selectItem from "@/utils/selectItem";
import { ClientToServerEvent, Item } from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import setItemHovered from "@/utils/set-item-hovered";

interface Props {
  item: Item;
  disabled: boolean;
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

  function takeItem() {
    gameState.mutateState((gameState) => {
      gameState.hoveredEntity = null;
      gameState.detailedEntity = null;
    });
    websocketConnection.emit(ClientToServerEvent.PickUpItem, {
      characterId: gameState.focusedCharacterId,
      itemId: item.entityProperties.id,
    });
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
        onClick={takeItem}
        onFocus={mouseEnterHandler}
        onBlur={mouseLeaveHandler}
        disabled={props.disabled}
      >
        {"Take"}
      </button>
      <button onClick={clickHandler} className="flex items-center h-full w-full ">
        <span className="pl-2 overflow-hidden whitespace-nowrap text-ellipsis ">
          {item.entityProperties.name}
        </span>
      </button>
    </li>
  );
}
