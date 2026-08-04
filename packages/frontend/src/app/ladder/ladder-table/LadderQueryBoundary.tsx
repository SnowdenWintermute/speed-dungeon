import React, { ReactNode } from "react";
import LoadingSpinner from "@speed-dungeon/ui/atoms/LoadingSpinner";
import { LadderQueryState, LadderQueryStatus } from "@/client-application/ladder-view/query-state";

// the three states every ladder query can be in, rendered the same way wherever one is displayed.
// not an observer: the observable read happens in the page that owns the query
export function LadderQueryBoundary<TResult>({
  state,
  children,
}: {
  state: LadderQueryState<TResult> | undefined;
  children: (result: TResult) => ReactNode;
}) {
  if (state === undefined) {
    return <p className="text-slate-400">waiting for a connection to the lobby server...</p>;
  }

  switch (state.type) {
    case LadderQueryStatus.Loading:
      return (
        <div className="h-10 w-10">
          <LoadingSpinner />
        </div>
      );
    case LadderQueryStatus.Failed:
      return <p className="text-red-400">{state.message}</p>;
    case LadderQueryStatus.Loaded:
      return <>{children(state.result)}</>;
  }
}
