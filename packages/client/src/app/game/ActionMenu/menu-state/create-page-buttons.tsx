import { ActionButtonCategory, ActionButtonsByCategory } from ".";
import { ACTION_MENU_PAGE_SIZE } from "..";
import { NextOrPrevious } from "@speed-dungeon/common";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";

export function createPageButtons(
  buttonsByCategory: ActionButtonsByCategory,
  pageCount: number = Math.ceil(
    buttonsByCategory[ActionButtonCategory.Numbered].length / ACTION_MENU_PAGE_SIZE
  ),
  onPageTurn?: (newPageNumber: number) => void
) {
  if (pageCount <= 1) return;

  const { actionMenuStore } = AppStore.get();
  const prevButtonHotkey = HOTKEYS.LEFT_MAIN;
  const previousPageButton = new ActionMenuButtonProperties(
    () => `Previous (${letterFromKeyCode(prevButtonHotkey)})`,
    `Previous (${letterFromKeyCode(prevButtonHotkey)})`,
    () => {
      actionMenuStore.getCurrentMenu().turnPage(NextOrPrevious.Previous);
      if (onPageTurn !== undefined) onPageTurn(actionMenuStore.getCurrentMenu().getPageIndex());
    }
  );
  previousPageButton.dedicatedKeys = [prevButtonHotkey, "ArrowLeft"];
  buttonsByCategory[ActionButtonCategory.Bottom].push(previousPageButton);

  const nextButtonHotkey = HOTKEYS.RIGHT_MAIN;
  const nextPageButton = new ActionMenuButtonProperties(
    () => `Next (${letterFromKeyCode(nextButtonHotkey)})`,
    `Next (${letterFromKeyCode(nextButtonHotkey)})`,
    () => {
      actionMenuStore.getCurrentMenu().turnPage(NextOrPrevious.Next);
      if (onPageTurn !== undefined) onPageTurn(actionMenuStore.getCurrentMenu().getPageIndex());
    }
  );
  nextPageButton.dedicatedKeys = [nextButtonHotkey, "ArrowRight"];
  buttonsByCategory[ActionButtonCategory.Bottom].push(nextPageButton);
}
