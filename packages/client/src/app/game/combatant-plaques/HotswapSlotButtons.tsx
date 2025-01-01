import React, { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/stores/game-store";
import { websocketConnection } from "@/singletons/websocket-connection";
import {
  ClientToServerEvent,
  NextOrPrevious,
  getNextOrPreviousNumber,
} from "@speed-dungeon/common";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import OpenHandIcon from "../../../../public/img/game-ui-icons/open-hand.svg";
import { HOTKEYS } from "@/hotkeys";

interface Props {
  entityId: string;
  selectedSlotIndex: number;
  numSlots: number;
  className: string;
  vertical: boolean;
  registerKeyEvents?: boolean;
}

export default function HotswapSlotButtons({
  entityId,
  selectedSlotIndex,
  numSlots,
  className,
  vertical,
  registerKeyEvents,
}: Props) {
  const listenerRef = useRef<(e: KeyboardEvent) => void | null>();
  const focusedCharacterId = useGameStore.getState().focusedCharacterId;
  const prevSlotIndexRef = useRef(selectedSlotIndex);
  const [waitingForIndexChange, setWaitingForIndexChange] = useState(false);

  function selectNextOrPrevious(nextOrPrevious: NextOrPrevious) {
    if (waitingForIndexChange)
      return console.log("still waiting for result of last input to slot change");
    const newIndex = getNextOrPreviousNumber(selectedSlotIndex, numSlots - 1, nextOrPrevious, {
      minNumber: 0,
    });
    console.log("new index to select: ", newIndex);

    websocketConnection.emit(ClientToServerEvent.SelectHoldableHotswapSlot, {
      characterId: focusedCharacterId,
      slotIndex: newIndex,
    });
    if (newIndex !== selectedSlotIndex) {
      prevSlotIndexRef.current = selectedSlotIndex;
      setWaitingForIndexChange(true);
    }
  }

  useEffect(() => {
    if (selectedSlotIndex !== prevSlotIndexRef.current) setWaitingForIndexChange(false);
  }, [selectedSlotIndex]);

  useEffect(() => {
    if (!registerKeyEvents) return;

    listenerRef.current = (e: KeyboardEvent) => {
      if (e.code === HOTKEYS.BOTTOM_LEFT) selectNextOrPrevious(NextOrPrevious.Previous);
      if (e.code === HOTKEYS.BOTTOM_RIGHT) selectNextOrPrevious(NextOrPrevious.Next);
    };

    window.addEventListener("keydown", listenerRef.current);
    return () => {
      if (listenerRef.current) window.removeEventListener("keydown", listenerRef.current);
    };
  }, [selectedSlotIndex, focusedCharacterId, numSlots, waitingForIndexChange]);

  return (
    <div className={className}>
      <HoverableTooltipWrapper tooltipText={"Select weapon swap slot (X, C)"}>
        <div
          className={`bg-slate-700 h-6 w-6 p-1 ${vertical ? "border-b" : "border-r"} border-slate-400`}
        >
          <OpenHandIcon className="h-full w-full fill-slate-400" />
        </div>
      </HoverableTooltipWrapper>
      {new Array(numSlots).fill(null).map((_nullValue, i) => (
        <div
          key={i}
          className={`m-0 ${vertical ? "border-b" : "border-r"} border-slate-400 last:border-none`}
        >
          <HotswapSlotButton
            entityId={entityId}
            index={i}
            isSelected={selectedSlotIndex === i}
            disabled={waitingForIndexChange}
          />
        </div>
      ))}
    </div>
  );
}

function HotswapSlotButton({
  entityId,
  isSelected,
  index,
  disabled,
}: {
  entityId: string;
  index: number;
  isSelected: boolean;
  disabled: boolean;
}) {
  const mutateGameState = useGameStore().mutateState;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={`p-1 h-6 w-6 ${isSelected ? "bg-slate-800" : "bg-slate-700"}
      text-sm hover:bg-slate-950 block disabled:opacity-50
      `}
      style={{ lineHeight: "14px" }}
      disabled={disabled}
      onClick={() => {
        websocketConnection.emit(ClientToServerEvent.SelectHoldableHotswapSlot, {
          characterId: entityId,
          slotIndex: index,
        });
      }}
    >
      {index + 1}
    </button>
  );
}
