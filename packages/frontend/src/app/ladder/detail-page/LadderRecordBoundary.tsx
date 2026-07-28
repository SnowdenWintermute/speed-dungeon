import React, { ReactNode } from "react";
import { LadderQueryState } from "@/client-application/ladder-view/query-state";
import { LadderQueryBoundary } from "../ladder-table/LadderQueryBoundary";

// what a record page adds to the three query states: a url reached from a stale link, or from
// somebody else's browser history, names a record that may be gone. the by-id queries answer that
// with undefined rather than throwing, and it is a page rather than an error
export function LadderRecordBoundary<TRecord>({
  state,
  missingMessage,
  children,
}: {
  state: LadderQueryState<TRecord | undefined> | undefined;
  missingMessage: string;
  children: (record: TRecord) => ReactNode;
}) {
  return (
    <LadderQueryBoundary state={state}>
      {(recordOption) =>
        recordOption === undefined ? (
          <p className="text-slate-400">{missingMessage}</p>
        ) : (
          children(recordOption)
        )
      }
    </LadderQueryBoundary>
  );
}
