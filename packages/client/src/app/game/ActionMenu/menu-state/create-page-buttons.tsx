import { getCurrentMenu } from "@/stores/game-store";
import { useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
} from ".";
import { ACTION_MENU_PAGE_SIZE } from "..";
import { NextOrPrevious, getNextOrPreviousNumber } from "@speed-dungeon/common";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";

export default function createPageButtons(
  menuState: ActionMenuState,
  buttonsByCategory: ActionButtonsByCategory,
  numPages: number = Math.ceil(
    buttonsByCategory[ActionButtonCategory.Numbered].length / ACTION_MENU_PAGE_SIZE
  ),
  onPageTurn?: (newPageNumber: number) => void
) {
  if (numPages > 1) {
    const prevButtonHotkey = HOTKEYS.LEFT_MAIN;
    const previousPageButton = new ActionMenuButtonProperties(
      `Previous (${letterFromKeyCode(prevButtonHotkey)})`,
      `Previous (${letterFromKeyCode(prevButtonHotkey)})`,
      () => {
        let newPage = null;
        useGameStore.getState().mutateState((state) => {
          newPage = getNextOrPreviousNumber(menuState.page, numPages, NextOrPrevious.Previous);
          getCurrentMenu(state).page = newPage;
        });
        if (onPageTurn && newPage !== null) onPageTurn(newPage);
      }
    );
    previousPageButton.dedicatedKeys = [prevButtonHotkey, "ArrowLeft"];
    buttonsByCategory[ActionButtonCategory.Bottom].push(previousPageButton);

    const nextButtonHotkey = HOTKEYS.RIGHT_MAIN;
    const nextPageButton = new ActionMenuButtonProperties(
      `Next (${letterFromKeyCode(nextButtonHotkey)})`,
      `Next (${letterFromKeyCode(nextButtonHotkey)})`,
      () => {
        let newPage = null;
        useGameStore.getState().mutateState((state) => {
          newPage = getNextOrPreviousNumber(menuState.page, numPages, NextOrPrevious.Next);
          getCurrentMenu(state).page = newPage;
        });

        if (onPageTurn && newPage !== null) onPageTurn(newPage);
      }
    );
    nextPageButton.dedicatedKeys = [nextButtonHotkey, "ArrowRight"];
    buttonsByCategory[ActionButtonCategory.Bottom].push(nextPageButton);
  }
}
