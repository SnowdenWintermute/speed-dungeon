import { BUTTON_HEIGHT_SMALL } from "@/client_consts";
import { GameState, useGameStore } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { NextOrPrevious } from "@speed-dungeon/common";
import React, { useEffect, useRef } from "react";

interface Props {
  numberOfPages: number;
  hidden: boolean;
}

export default function PageTurningButtons({ numberOfPages, hidden }: Props) {
  const mutateGameState = useGameStore().mutateState;
  const currentPageNumber = useGameStore().actionMenuCurrentPageNumber;
  const keypressListenerRef = useRef<(e: KeyboardEvent) => void | null>();
  const keyupListenerRef = useRef<(e: KeyboardEvent) => void | null>();

  function handleClickNextPage() {
    turnPage(mutateGameState, currentPageNumber, numberOfPages, NextOrPrevious.Next);
  }
  function handleClickPreviousPage() {
    turnPage(mutateGameState, currentPageNumber, numberOfPages, NextOrPrevious.Previous);
  }

  useEffect(() => {
    keypressListenerRef.current = (e: KeyboardEvent) => {
      if (numberOfPages < 1) return;
      if (e.code === "KeyW") {
        turnPage(mutateGameState, currentPageNumber, numberOfPages, NextOrPrevious.Previous);
      }
      if (e.code === "KeyE") {
        turnPage(mutateGameState, currentPageNumber, numberOfPages, NextOrPrevious.Next);
      }
    };
    keyupListenerRef.current = (e: KeyboardEvent) => {
      if (numberOfPages < 1) return;
      if (e.code === "ArrowLeft") {
        turnPage(mutateGameState, currentPageNumber, numberOfPages, NextOrPrevious.Previous);
      }
      if (e.code === "ArrowRight") {
        turnPage(mutateGameState, currentPageNumber, numberOfPages, NextOrPrevious.Next);
      }
    };
    window.addEventListener("keypress", keypressListenerRef.current);
    window.addEventListener("keyup", keyupListenerRef.current);

    return () => {
      if (keypressListenerRef.current)
        window.removeEventListener("keypress", keypressListenerRef.current);
      if (keyupListenerRef.current) window.removeEventListener("keyup", keyupListenerRef.current);
    };
  }, [numberOfPages, currentPageNumber]);

  const hiddenStyle = hidden ? "opacity-0 pointer-events-none" : "";

  return (
    <ul
      className={`flex list-none border border-slate-400 bg-slate-700 w-full justify-between items-center
                  pointer-events-auto ${hiddenStyle}`}
    >
      <button
        onClick={handleClickPreviousPage}
        className="pr-2 pl-2"
        style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}
      >
        {"Previous page (W)"}
      </button>
      <div>{`${currentPageNumber}/${numberOfPages}`}</div>
      <button
        onClick={handleClickNextPage}
        className="pr-2 pl-2"
        style={{ height: `${BUTTON_HEIGHT_SMALL}rem` }}
      >
        {"Next page (E)"}
      </button>
    </ul>
  );
}

function turnPage(
  mutateGameState: MutateState<GameState>,
  currentPageNumber: number,
  numberOfPages: number,
  direction: NextOrPrevious
) {
  mutateGameState((gameState) => {
    switch (direction) {
      case NextOrPrevious.Next:
        if (currentPageNumber >= numberOfPages - 1) gameState.actionMenuCurrentPageNumber = 0;
        else gameState.actionMenuCurrentPageNumber += 1;
        break;
      case NextOrPrevious.Previous:
        if (currentPageNumber === 0) gameState.actionMenuCurrentPageNumber = numberOfPages - 1;
        else gameState.actionMenuCurrentPageNumber -= 1;
        break;
    }
  });
}
