"use client";
import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { useLadderQuery } from "@/hooks/use-ladder-query";
import { LadderBoardView } from "../board-page";
import { BoardControl } from "../board-page/BoardControl";
import { ControlSchemeSelector } from "../board-page/ControlSchemeSelector";
import { FloorSelector } from "../board-page/FloorSelector";
import { GameModeSelector } from "../board-page/GameModeSelector";
import { floorClearTimesColumns } from "../boards/floor-clear-times-columns";
import { floorClearEntryKey } from "../boards/floor-clear-entry-key";
import { FloorClearTimesBoardQuery } from "../query-schemas";
import { floorClearTimesBoardRoute } from "../routes";
import { LADDER_EMPTY_MESSAGES, floorClearTimesBoardTitle } from "../board-text";

export const FloorClearTimesBoard = observer(({ query }: { query: FloorClearTimesBoardQuery }) => {
  const clientApplication = useClientApplication();
  const router = useRouter();
  const state = useLadderQuery(clientApplication.ladderView.floorClearTimes, query);

  // every control means "this board, with one thing different". a filter or a sort returns to page
  // zero, since the row a reader was looking at is not on the same page of a different board
  function showBoard(changes: Partial<FloorClearTimesBoardQuery>) {
    router.push(floorClearTimesBoardRoute({ ...query, ...changes, page: 0 }));
  }

  return (
    <LadderBoardView
      title={floorClearTimesBoardTitle(query.modeOption, query.controlSchemeOption)}
      controls={
        <>
          <BoardControl label="Floor">
            <FloorSelector value={query.floor} onChange={(floor) => showBoard({ floor })} />
          </BoardControl>
          <BoardControl label="Game Mode">
            <GameModeSelector
              value={query.modeOption}
              onChange={(modeOption) => showBoard({ modeOption })}
            />
          </BoardControl>
          <BoardControl label="Control Scheme">
            <ControlSchemeSelector
              value={query.controlSchemeOption}
              onChange={(controlSchemeOption) => showBoard({ controlSchemeOption })}
            />
          </BoardControl>
        </>
      }
      columns={floorClearTimesColumns(query.sortOption, (sortOption) => showBoard({ sortOption }))}
      keyOf={floorClearEntryKey}
      emptyMessage={LADDER_EMPTY_MESSAGES.NO_FLOOR_CLEARS}
      state={state}
      hrefForPage={(page) => floorClearTimesBoardRoute({ ...query, page })}
    />
  );
});
