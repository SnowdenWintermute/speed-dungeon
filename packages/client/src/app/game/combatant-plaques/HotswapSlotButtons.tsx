import React, { useEffect, useRef, useState } from "react";
import { websocketConnection } from "@/singletons/websocket-connection";
import {
  ClientToServerEvent,
  NextOrPrevious,
  getNextOrPreviousNumber,
} from "@speed-dungeon/common";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { HOTKEYS } from "@/hotkeys";
import { disableButtonBecauseNotThisCombatantTurn } from "../ActionMenu/menu-state/base";
import { IconName, SVG_ICONS } from "@/app/icons";
import { AppStore } from "@/mobx-stores/app-store";
import { observer } from "mobx-react-lite";

interface Props {
  entityId: string;
  selectedSlotIndex: number;
  numSlots: number;
  className: string;
  vertical: boolean;
  registerKeyEvents?: boolean;
}

export const HotswapSlotButtons = observer(
  ({ entityId, selectedSlotIndex, numSlots, className, vertical, registerKeyEvents }: Props) => {
    const listenerRef = useRef<(e: KeyboardEvent) => void | null>(null);

    const { gameStore } = AppStore.get();
    const focusedCharacterId = gameStore.getExpectedFocusedCharacterId();
    const prevSlotIndexRef = useRef(selectedSlotIndex);
    const [waitingForIndexChange, setWaitingForIndexChange] = useState(false);
    const disableIfNotTurn = disableButtonBecauseNotThisCombatantTurn(entityId);

    function selectNextOrPrevious(nextOrPrevious: NextOrPrevious) {
      if (waitingForIndexChange) return;
      if (disableIfNotTurn) return;

      const newIndex = getNextOrPreviousNumber(selectedSlotIndex, numSlots - 1, nextOrPrevious, {
        minNumber: 0,
      });

      websocketConnection.emit(ClientToServerEvent.SelectHoldableHotswapSlot, {
        characterId: focusedCharacterId,
        slotIndex: newIndex,
      });

      if (newIndex !== selectedSlotIndex) {
        prevSlotIndexRef.current = selectedSlotIndex;
        // setWaitingForIndexChange(true);
      }
    }

    useEffect(() => {
      if (selectedSlotIndex !== prevSlotIndexRef.current) {
        // setWaitingForIndexChange(false);
      }
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
        <HoverableTooltipWrapper
          extraStyles="cursor-help"
          tooltipText={"Select weapon swap slot (X, C)"}
        >
          <div
            className={`bg-slate-700 h-6 w-6 p-1 ${vertical ? "border-b" : "border-r"} border-slate-400`}
          >
            {SVG_ICONS[IconName.OpenHand]("h-full w-full fill-slate-400")}
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
              disabled={waitingForIndexChange || disableIfNotTurn}
            />
          </div>
        ))}
      </div>
    );
  }
);

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
