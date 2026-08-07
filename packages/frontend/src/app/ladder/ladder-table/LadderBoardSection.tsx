import React from "react";
import { LadderPage } from "@speed-dungeon/common";
import { LadderQueryState } from "@/client-application/ladder-view/query-state";
import { DataTable } from "@speed-dungeon/ui/atoms/DataTable";
import { DataTableColumn } from "@speed-dungeon/ui/atoms/DataTable/column";
import { LadderQueryBoundary } from "./LadderQueryBoundary";
import { renderSortIndicator } from "./sort-indicator";
import { LadderLink } from "../LadderLink";

export function LadderBoardSection<TEntry>({
  title,
  fullBoardHrefOption,
  columns,
  keyOf,
  emptyMessage,
  state,
}: {
  title: string;
  fullBoardHrefOption?: string;
  columns: DataTableColumn<TEntry>[];
  keyOf: (entry: TEntry) => string;
  emptyMessage: string;
  state: LadderQueryState<LadderPage<TEntry>> | undefined;
}) {
  return (
    <section className="w-full mb-10">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-xl">{title}</h2>
        {fullBoardHrefOption !== undefined && (
          <LadderLink href={fullBoardHrefOption}>View full board</LadderLink>
        )}
      </div>
      <LadderQueryBoundary state={state}>
        {(ladderPage) => (
          <DataTable
            columns={columns}
            entries={ladderPage.entries}
            keyOf={keyOf}
            emptyMessage={emptyMessage}
            renderSortIndicator={renderSortIndicator}
          />
        )}
      </LadderQueryBoundary>
    </section>
  );
}
