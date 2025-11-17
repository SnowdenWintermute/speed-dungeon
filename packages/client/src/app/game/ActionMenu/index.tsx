import React, { useEffect } from "react";
import { HOTKEYS } from "@/hotkeys";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import { BUTTON_HEIGHT, SPACING_REM_SMALL } from "@/client_consts";
import { ACTION_MENU_PAGE_SIZE } from "./menu-state";
import { NextOrPrevious } from "@speed-dungeon/common";

export const SHARD_ITEM_HOTKEY = HOTKEYS.SIDE_2;

export const ActionMenu = observer(({ inputLocked }: { inputLocked: boolean }) => {
  if (inputLocked) return <div />;

  const { actionMenuStore } = AppStore.get();

  const currentMenu = actionMenuStore.getCurrentMenu();
  const topSection = currentMenu.getTopSection();
  const numberedButtons = currentMenu.getNumberedButtonsOnCurrentPage();
  const centralSection = currentMenu.getCentralSection();
  const bottomSection = currentMenu.getBottomSection();

  useEffect(() => {
    if (numberedButtons.length === 0 && currentMenu.pageIndex > 0) {
      currentMenu.turnPage(NextOrPrevious.Previous);
    }
  }, [numberedButtons.length, currentMenu.pageIndex]);

  return (
    <section className={`flex flex-col justify-between`}>
      <div
        className={`flex list-none min-w-[25rem] max-w-[25rem] relative`}
        style={{ marginBottom: `${SPACING_REM_SMALL}rem` }}
      >
        {topSection}
      </div>
      <div
        className={`mb-3 flex flex-col min-w-[25rem] max-w-[25rem] border-t border-slate-400`}
        style={{
          height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem`,
        }}
      >
        {numberedButtons}
        {centralSection}
      </div>
      <div className="min-w-[25rem] max-w-[25rem]">{bottomSection}</div>
    </section>
  );
});
