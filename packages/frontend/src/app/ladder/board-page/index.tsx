import React, { ReactNode } from "react";
import { LadderPage } from "@speed-dungeon/common";
import { LadderQueryState } from "@/client-application/ladder-view/query-state";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { LadderQueryBoundary } from "../ladder-table/LadderQueryBoundary";
import { renderSortIndicator } from "../ladder-table/sort-indicator";
import { LadderPagination } from "./LadderPagination";

// what every full board page is: a heading, its own filters, the shared table, and a pager. the
// boards differ only in their columns and in what sits in the controls row.
// not an observer — the observable read happens in the page that owns the query
export function LadderBoardView<TEntry>({
  title,
  controls,
  columns,
  keyOf,
  emptyMessage,
  state,
  hrefForPage,
}: {
  title: string;
  controls: ReactNode;
  columns: DataTableColumn<TEntry>[];
  keyOf: (entry: TEntry) => string;
  emptyMessage: string;
  state: LadderQueryState<LadderPage<TEntry>> | undefined;
  hrefForPage: (page: number) => string;
}) {
  return (
    <section className="w-full">
      <h1 className="text-2xl mb-4">{title}</h1>
      <div className="flex flex-wrap items-end">{controls}</div>
      <LadderQueryBoundary state={state}>
        {(ladderPage) => (
          <>
            <DataTable
              columns={columns}
              entries={ladderPage.entries}
              keyOf={keyOf}
              emptyMessage={emptyMessage}
              renderSortIndicator={renderSortIndicator}
            />
            <LadderPagination ladderPage={ladderPage} hrefForPage={hrefForPage} />
          </>
        )}
      </LadderQueryBoundary>
    </section>
  );
}
