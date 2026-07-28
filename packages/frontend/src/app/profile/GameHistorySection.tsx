"use client";
import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { UserGameHistoryQuery, Username } from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { useLadderQuery } from "@/hooks/use-ladder-query";
import { LadderPagination } from "../ladder/board-page/LadderPagination";
import { LadderQueryBoundary } from "../ladder/ladder-table/LadderQueryBoundary";
import { LadderTable } from "../ladder/ladder-table";
import { ProfileUrlState } from "../ladder/query-schemas";
import { playerProfileStateRoute } from "../ladder/routes";
import { GAME_HISTORY_COLUMNS, gameHistoryEntryKey } from "./game-history-columns";

// the one part of a profile that pages. the personal bests selectors travel with the page number,
// so paging a history keeps the facet a reader was looking at, and choosing a facet keeps their page
export const GameHistorySection = observer(
  ({ username, urlState }: { username: Username; urlState: ProfileUrlState }) => {
    const clientApplication = useClientApplication();
    // assembled from two primitives rather than arriving whole from a schema, so it is memoized —
    // the fetching hook keys its effect off the query object's identity
    const query: UserGameHistoryQuery = useMemo(
      () => ({ username, page: urlState.page }),
      [username, urlState.page]
    );
    const state = useLadderQuery(clientApplication.ladderView.userGameHistory, query);

    return (
      <>
        <h2 className="text-xl mb-2">Game History</h2>
        <LadderQueryBoundary state={state}>
          {(ladderPage) => (
            <>
              <LadderTable
                columns={GAME_HISTORY_COLUMNS}
                entries={ladderPage.entries}
                keyOf={gameHistoryEntryKey}
                emptyMessage="No games played yet."
              />
              <LadderPagination
                ladderPage={ladderPage}
                hrefForPage={(page) => playerProfileStateRoute(username, { ...urlState, page })}
              />
            </>
          )}
        </LadderQueryBoundary>
      </>
    );
  }
);
