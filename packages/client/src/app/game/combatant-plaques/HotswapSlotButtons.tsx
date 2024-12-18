import React, { useState } from "react";
import { useGameStore } from "@/stores/game-store";
import { websocketConnection } from "@/singletons/websocket-connection";
import { ClientToServerEvent } from "@speed-dungeon/common";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import GripIcon from "../../../../public/img/game-ui-icons/grip.svg";
import OpenHandIcon from "../../../../public/img/game-ui-icons/open-hand.svg";

interface Props {
  entityId: string;
  selectedSlotIndex: number;
  numSlots: number;
  className: string;
  vertical: boolean;
}

export default function HotswapSlotButtons({
  entityId,
  selectedSlotIndex,
  numSlots,
  className,
  vertical,
}: Props) {
  return (
    <div className={className}>
      <HoverableTooltipWrapper tooltipText={"Select weapon swap slot"}>
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
          <HotswapSlotButton entityId={entityId} index={i} isSelected={selectedSlotIndex === i} />
        </div>
      ))}
    </div>
  );
}

function HotswapSlotButton({
  entityId,
  isSelected,
  index,
}: {
  entityId: string;
  index: number;
  isSelected: boolean;
}) {
  const mutateGameState = useGameStore().mutateState;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={`p-1 h-6 w-6 ${isSelected ? "bg-slate-800" : "bg-slate-700"}
      text-sm hover:bg-slate-950 block
      `}
      style={{ lineHeight: "14px" }}
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
