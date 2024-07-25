import React from "react";
import {
  createActionButtonMouseEnterHandler,
  createActionButtonMouseLeaveHandler,
} from "../ActionMenu/hover-handlers";
import { GameActionType } from "../ActionMenu/game-actions";
import { useGameStore } from "@/stores/game-store";
import getItemOnGround from "@/utils/getItemOnGround";
import selectItem from "@/utils/selectItem";
import { useAlertStore } from "@/stores/alert-store";
import { setAlert } from "@/app/components/alerts";
import { useWebsocketStore } from "@/stores/websocket-store";
import { ClientToServerEvent } from "@speed-dungeon/common";
import { DetailableEntityType } from "@/stores/game-store/detailable-entities";
import toggleDetailItem from "@/utils/toggle-detail-item";

interface Props {
  itemId: string;
  name: string;
  disabled: boolean;
}

export default function ItemOnGround(props: Props) {
  const { itemId } = props;
  const socketOption = useWebsocketStore().socketOption;
  const gameState = useGameStore();
  const mutateAlertState = useAlertStore().mutateState;
  function mouseEnterHandler() {
    createActionButtonMouseEnterHandler(gameState, mutateAlertState, {
      type: GameActionType.SelectItem,
      itemId,
      stackSize: 1,
    })();
  }
  function mouseLeaveHandler() {
    createActionButtonMouseLeaveHandler(gameState, {
      type: GameActionType.SelectItem,
      itemId,
      stackSize: 1,
    })();
  }
  function clickHandler() {
    const itemResult = getItemOnGround(gameState, itemId);
    if (itemResult instanceof Error) return setAlert(mutateAlertState, itemResult.message);
    toggleDetailItem(gameState.mutateState, itemResult);
  }

  function takeItem() {
    gameState.mutateState((gameState) => {
      gameState.hoveredEntity = null;
      gameState.detailedEntity = null;
    });
    socketOption?.emit(ClientToServerEvent.PickUpItem, {
      characterId: gameState.focusedCharacterId,
      itemId,
    });
  }

  const conditionalClassNames = (() => {
    if (gameState.detailedEntity !== null) {
      if (
        gameState.detailedEntity.type === DetailableEntityType.Item &&
        gameState.detailedEntity.item.entityProperties.id === itemId
      )
        return "border-yellow-400 hover:border-t";
    }
    if (gameState.hoveredEntity !== null) {
      if (
        gameState.hoveredEntity.type === DetailableEntityType.Item &&
        gameState.hoveredEntity.item.entityProperties.id === itemId
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
        <span className="pl-2 overflow-hidden whitespace-nowrap text-ellipsis ">{props.name}</span>
      </button>
    </li>
  );
}
