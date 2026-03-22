import React, { useEffect, useRef, useState } from "react";
import {
  ClientIntentType,
  CombatantId,
  NextOrPrevious,
  getNextOrPreviousNumber,
} from "@speed-dungeon/common";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { disableButtonBecauseNotThisCombatantTurn } from "../ActionMenu/menu-state/base";
import { IconName, SVG_ICONS } from "@/app/icons";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import { HOTKEYS } from "@/client-application/ui/keybind-config";
import { ClientSingleton } from "@/client-application/clients/singleton";
import { GameClient } from "@/client-application/clients/game";

interface Props {
  entityId: CombatantId;
  selectedSlotIndex: number;
  slotsCount: number;
  className: string;
  vertical: boolean;
  registerKeyEvents?: boolean;
}

export const HotswapSlotButtons = observer(
  ({ entityId, selectedSlotIndex, slotsCount, className, vertical, registerKeyEvents }: Props) => {
    const listenerRef = useRef<(e: KeyboardEvent) => void | null>(null);

    const clientApplication = useClientApplication();
    const { combatantFocus, uiStore, gameClientRef } = clientApplication;

    const focusedCharacterId = combatantFocus.requireFocusedCharacterId();
    const prevSlotIndexRef = useRef(selectedSlotIndex);
    const [waitingForIndexChange, setWaitingForIndexChange] = useState(false);
    const disableIfNotTurn = disableButtonBecauseNotThisCombatantTurn(entityId);

    function selectNextOrPrevious(nextOrPrevious: NextOrPrevious) {
      if (waitingForIndexChange) return;
      if (disableIfNotTurn) return;

      const newIndex = getNextOrPreviousNumber(selectedSlotIndex, slotsCount - 1, nextOrPrevious, {
        minNumber: 0,
      });

      gameClientRef.get().dispatchIntent({
        type: ClientIntentType.SelectHoldableHotswapSlot,
        data: {
          characterId: focusedCharacterId,
          slotIndex: newIndex,
        },
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

    const hotkeysDisabled = uiStore.inputs.getHotkeysDisabled();

    useEffect(() => {
      if (!registerKeyEvents) return;

      listenerRef.current = (e: KeyboardEvent) => {
        if (uiStore.inputs.getHotkeysDisabled()) return;
        if (e.code === HOTKEYS.BOTTOM_LEFT) selectNextOrPrevious(NextOrPrevious.Previous);
        if (e.code === HOTKEYS.BOTTOM_RIGHT) selectNextOrPrevious(NextOrPrevious.Next);
      };

      window.addEventListener("keydown", listenerRef.current);
      return () => {
        if (listenerRef.current) window.removeEventListener("keydown", listenerRef.current);
      };
    }, [selectedSlotIndex, focusedCharacterId, slotsCount, waitingForIndexChange, hotkeysDisabled]);

    if (slotsCount < 2) return <div />;

    return (
      <div className={className}>
        {!vertical && (
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
        )}
        {new Array(slotsCount).fill(null).map((_nullValue, i) => (
          <div
            key={i}
            className={`m-0 ${vertical ? "border-b" : "border-r"} border-slate-400 last:border-none`}
          >
            <HotswapSlotButton
              entityId={entityId}
              index={i}
              isSelected={selectedSlotIndex === i}
              disabled={waitingForIndexChange || disableIfNotTurn}
              gameClientRef={gameClientRef}
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
  gameClientRef,
}: {
  entityId: CombatantId;
  index: number;
  isSelected: boolean;
  disabled: boolean;
  gameClientRef: ClientSingleton<GameClient>;
}) {
  return (
    <HoverableTooltipWrapper
      extraStyles="cursor-help"
      tooltipText={"Select weapon swap slot (X, C)"}
    >
      <button
        className={`p-1 h-6 w-6 ${isSelected ? "bg-slate-800" : "bg-slate-700"}
      text-sm hover:bg-slate-950 block disabled:opacity-50
      `}
        style={{ lineHeight: "14px" }}
        disabled={disabled}
        onClick={() => {
          gameClientRef.get().dispatchIntent({
            type: ClientIntentType.SelectHoldableHotswapSlot,
            data: {
              characterId: entityId,
              slotIndex: index,
            },
          });
        }}
      >
        {index + 1}
      </button>
    </HoverableTooltipWrapper>
  );
}
