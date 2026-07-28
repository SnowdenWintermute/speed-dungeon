"use client";
import React from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import { CHARACTER_CONTROL_SCHEME_STRINGS, CumulativeClearTimesQuery } from "@speed-dungeon/common";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { useLadderQuery } from "@/hooks/use-ladder-query";
import { LadderBoardView } from "../board-page";
import { BoardControl } from "../board-page/BoardControl";
import { ControlSchemeSelector } from "../board-page/ControlSchemeSelector";
import { CUMULATIVE_CLEAR_TIMES_COLUMNS } from "../boards/cumulative-clear-columns";
import { floorClearEntryKey } from "../boards/floor-clear-entry-key";
import { cumulativeClearTimesBoardRoute } from "../routes";

// the board's order is fixed — deepest floor first, then fastest cumulative time — so no header
// here sorts. it spans game modes deliberately, which is why there is no mode selector either
export const CumulativeClearTimesBoard = observer(
  ({ query }: { query: CumulativeClearTimesQuery }) => {
    const clientApplication = useClientApplication();
    const router = useRouter();
    const state = useLadderQuery(clientApplication.ladderView.cumulativeClearTimes, query);

    return (
      <LadderBoardView
        title={`Deepest Cumulative Time To Clear [${CHARACTER_CONTROL_SCHEME_STRINGS[query.controlScheme]}s]`}
        controls={
          <BoardControl label="Control Scheme">
            <ControlSchemeSelector
              value={query.controlScheme}
              onChange={(controlScheme) =>
                router.push(cumulativeClearTimesBoardRoute({ ...query, controlScheme, page: 0 }))
              }
            />
          </BoardControl>
        }
        columns={CUMULATIVE_CLEAR_TIMES_COLUMNS}
        keyOf={floorClearEntryKey}
        emptyMessage="No floor clears recorded yet."
        state={state}
        hrefForPage={(page) => cumulativeClearTimesBoardRoute({ ...query, page })}
      />
    );
  }
);
