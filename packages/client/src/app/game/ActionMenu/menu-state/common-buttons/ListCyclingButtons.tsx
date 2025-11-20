import React from "react";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { NextOrPrevious } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import { HotkeyButtonTypes } from "@/mobx-stores/hotkeys";

interface Props {
  onCycle: (direction: NextOrPrevious) => void;
  itemCount: number | null;
  currentIndex: number;
  listTitle: string;
  directionTitle?: string;
}

export const ListCyclingButtons = observer((props: Props) => {
  const { listTitle, itemCount, currentIndex, directionTitle, onCycle } = props;

  const { hotkeysStore } = AppStore.get();

  const prevButtonType = HotkeyButtonTypes.CycleBack;
  const nextButtonType = HotkeyButtonTypes.CycleForward;

  const prevButtonHotkey = hotkeysStore.getKeybind(prevButtonType);
  const nextButtonHotkey = hotkeysStore.getKeybind(nextButtonType);

  let parentHiddenStyles = "pointer-events-auto";
  if (itemCount !== null && itemCount <= 1) {
    parentHiddenStyles = "opacity-0 pointer-events-none";
  }

  const listPositionHiddenStyles = itemCount === null ? "hidden" : "";

  return (
    <div
      className={`${parentHiddenStyles} flex justify-between bg-slate-700 relative border border-slate-400 h-8`}
    >
      <div className="flex-1 border-r border-slate-400 h-full">
        <HotkeyButton
          className="w-full h-full"
          hotkeys={prevButtonHotkey}
          onClick={() => onCycle(NextOrPrevious.Previous)}
        >
          Previous {directionTitle || ""} ({hotkeysStore.getKeybindString(prevButtonType)})
        </HotkeyButton>
      </div>
      <div
        className={`h-full flex items-center justify-center pr-2 pl-2 ${listPositionHiddenStyles}`}
      >
        <span>
          {listTitle} {currentIndex + 1}/{itemCount}
        </span>
      </div>
      <div className="flex-1 flex border-l border-slate-400 h-full">
        <HotkeyButton
          className="w-full h-full"
          hotkeys={nextButtonHotkey}
          onClick={() => onCycle(NextOrPrevious.Next)}
        >
          Next {directionTitle} ({hotkeysStore.getKeybindString(nextButtonType)})
        </HotkeyButton>
      </div>
    </div>
  );
});
