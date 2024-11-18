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
  buttonsByCategory: ActionButtonsByCategory
) {
  const numPages = Math.ceil(
    buttonsByCategory[ActionButtonCategory.Numbered].length / ACTION_MENU_PAGE_SIZE
  );

  useGameStore.getState().mutateState((state) => {
    getCurrentMenu(state).numPages = numPages;
  });

  if (numPages > 1) {
    const prevButtonHotkey = HOTKEYS.RIGHT_MAIN;
    const previousPageButton = new ActionMenuButtonProperties(
      `Previous (${letterFromKeyCode(prevButtonHotkey)})`,
      () => {
        useGameStore.getState().mutateState((state) => {
          const newPage = getNextOrPreviousNumber(
            menuState.page,
            numPages,
            NextOrPrevious.Previous
          );
          getCurrentMenu(state).page = newPage;
        });
      }
    );
    previousPageButton.dedicatedKeys = [prevButtonHotkey, "ArrowLeft"];
    buttonsByCategory[ActionButtonCategory.Bottom].push(previousPageButton);

    const nextButtonHotkey = HOTKEYS.LEFT_MAIN;
    const nextPageButton = new ActionMenuButtonProperties(`Next (${nextButtonHotkey})`, () => {
      useGameStore.getState().mutateState((state) => {
        const newPage = getNextOrPreviousNumber(menuState.page, numPages, NextOrPrevious.Next);
        getCurrentMenu(state).page = newPage;
      });
    });
    nextPageButton.dedicatedKeys = [nextButtonHotkey, "ArrowRight"];
    buttonsByCategory[ActionButtonCategory.Bottom].push(nextPageButton);
  }

  buttonsByCategory[ActionButtonCategory.Numbered] = buttonsByCategory[
    ActionButtonCategory.Numbered
  ].slice(
    (menuState.page - 1) * ACTION_MENU_PAGE_SIZE,
    (menuState.page - 1) * ACTION_MENU_PAGE_SIZE + ACTION_MENU_PAGE_SIZE
  );
}
