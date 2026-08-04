import React, { useEffect, useRef } from "react";
import { NextOrPrevious, getNextOrPreviousNumber, normalizeKeyValue } from "@speed-dungeon/common";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { IconName, SVG_ICONS } from "@/app/icons";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";
import { useHotkeysDisabled } from "@/app/components/atoms/ui-context";

interface Props {
  // null when the slot cannot be changed right now — in a game, when it is not this combatant's
  // turn. never null on a public page, where changing it only changes what is being looked at
  onSelectSlotOption: null | ((slotIndex: number) => void);
  selectedSlotIndex: number;
  slotsCount: number;
  className: string;
  vertical: boolean;
  registerKeyEvents?: boolean;
}

export const HotswapSlotButtons = observer(
  ({
    onSelectSlotOption,
    selectedSlotIndex,
    slotsCount,
    className,
    vertical,
    registerKeyEvents,
  }: Props) => {
    const listenerRef = useRef<((e: KeyboardEvent) => void) | null>(null);
    const { uiStore } = useClientApplication();
    const hotkeysDisabled = useHotkeysDisabled();

    function selectNextOrPrevious(nextOrPrevious: NextOrPrevious) {
      if (onSelectSlotOption === null) {
        return;
      }

      onSelectSlotOption(
        getNextOrPreviousNumber(selectedSlotIndex, slotsCount - 1, nextOrPrevious, {
          minNumber: 0,
        })
      );
    }

    useEffect(() => {
      if (!registerKeyEvents) {
        return;
      }

      listenerRef.current = (e: KeyboardEvent) => {
        if (hotkeysDisabled) {
          return;
        }
        const pressed = normalizeKeyValue(e.key);
        if (uiStore.keybinds.getKeybind(HotkeyButtonTypes.CycleHotswapSlotBack).includes(pressed)) {
          selectNextOrPrevious(NextOrPrevious.Previous);
        }
        if (
          uiStore.keybinds.getKeybind(HotkeyButtonTypes.CycleHotswapSlotForward).includes(pressed)
        ) {
          selectNextOrPrevious(NextOrPrevious.Next);
        }
      };

      window.addEventListener("keydown", listenerRef.current);
      return () => {
        if (listenerRef.current) {
          window.removeEventListener("keydown", listenerRef.current);
        }
      };
    }, [selectedSlotIndex, slotsCount, onSelectSlotOption, hotkeysDisabled]);

    if (slotsCount < 2) {
      return <div />;
    }

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
              index={i}
              isSelected={selectedSlotIndex === i}
              onSelectSlotOption={onSelectSlotOption}
            />
          </div>
        ))}
      </div>
    );
  }
);

function HotswapSlotButton({
  isSelected,
  index,
  onSelectSlotOption,
}: {
  index: number;
  isSelected: boolean;
  onSelectSlotOption: null | ((slotIndex: number) => void);
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
        disabled={onSelectSlotOption === null}
        onClick={() => onSelectSlotOption?.(index)}
      >
        {index + 1}
      </button>
    </HoverableTooltipWrapper>
  );
}
