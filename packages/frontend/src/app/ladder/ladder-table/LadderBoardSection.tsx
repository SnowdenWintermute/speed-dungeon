import React from "react";
import Link from "next/link";
import { LadderPage } from "@speed-dungeon/common";
import { LadderQueryState } from "@/client-application/ladder-view/query-state";
import { LadderTableColumn } from "./column";
import { LadderQueryBoundary } from "./LadderQueryBoundary";
import { LadderTable } from ".";

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
  columns: LadderTableColumn<TEntry>[];
  keyOf: (entry: TEntry) => string;
  emptyMessage: string;
  state: LadderQueryState<LadderPage<TEntry>> | undefined;
}) {
  return (
    <section className="w-full mb-10">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-xl">{title}</h2>
        {fullBoardHrefOption !== undefined && (
          <Link href={fullBoardHrefOption} className="hover:underline">
            View full board
          </Link>
        )}
      </div>
      <LadderQueryBoundary state={state}>
        {(ladderPage) => (
          <LadderTable
            columns={columns}
            entries={ladderPage.entries}
            keyOf={keyOf}
            emptyMessage={emptyMessage}
          />
        )}
      </LadderQueryBoundary>
    </section>
  );
}
