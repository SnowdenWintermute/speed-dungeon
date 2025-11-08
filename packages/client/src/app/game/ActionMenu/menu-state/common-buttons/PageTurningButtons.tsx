import React from "react";
import { ActionMenuState } from "..";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { NextOrPrevious } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";

interface Props {
  menuState: ActionMenuState;
}

export const PageTurningButtons = observer((props: Props) => {
  const { menuState } = props;
  const pageCount = menuState.getPageCount();
  const currentPageIndex = menuState.pageIndex;

  const prevButtonHotkey = HOTKEYS.LEFT_MAIN;
  const nextButtonHotkey = HOTKEYS.RIGHT_MAIN;

  const hiddenStyles = pageCount <= 1 ? "opacity-0 pointer-events-none" : "pointer-events-auto";

  return (
    <div
      className={`${hiddenStyles} flex justify-between bg-slate-700 relative border border-slate-400 h-8`}
    >
      <div className="flex-1 border-r border-slate-400 h-full">
        <HotkeyButton
          className="w-full h-full"
          hotkeys={[prevButtonHotkey, "ArrowLeft"]}
          onClick={() => menuState.turnPage(NextOrPrevious.Previous)}
        >
          Previous ({letterFromKeyCode(prevButtonHotkey)})
        </HotkeyButton>
      </div>
      <div
        className="h-full flex items-center justify-center pr-2 pl-2"
        style={pageCount <= 1 ? { display: "none" } : {}}
      >
        <span>
          Page {currentPageIndex + 1}/{pageCount}
        </span>
      </div>
      <div className="flex-1 flex border-l border-slate-400 h-full">
        <HotkeyButton
          className="w-full h-full"
          hotkeys={[nextButtonHotkey, "ArrowRight"]}
          onClick={() => menuState.turnPage(NextOrPrevious.Next)}
        >
          Next ({letterFromKeyCode(nextButtonHotkey)})
        </HotkeyButton>
      </div>
    </div>
  );
});
