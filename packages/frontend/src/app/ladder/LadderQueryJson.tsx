"use client";
import { LadderQueryState, LadderQueryStatus } from "@/client-application/ladder-view/query-state";

// scaffolding: shows what a query answered and nothing else, until the real facet views are built.
// not an observer — the observable read happens in the page that owns the query
export function LadderQueryJson<TResult>({
  title,
  invalidQueryMessageOption,
  state,
}: {
  title: string;
  invalidQueryMessageOption: string | undefined;
  state: LadderQueryState<TResult> | undefined;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-2">{title}</h2>
      <pre className="whitespace-pre-wrap">
        {bodyText(invalidQueryMessageOption, state)}
      </pre>
    </section>
  );
}

function bodyText<TResult>(
  invalidQueryMessageOption: string | undefined,
  state: LadderQueryState<TResult> | undefined
): string {
  if (invalidQueryMessageOption !== undefined) {
    return `invalid query params: ${invalidQueryMessageOption}`;
  }
  if (state === undefined) {
    return "waiting for a connection to the lobby server...";
  }
  switch (state.type) {
    case LadderQueryStatus.Loading:
      return "loading...";
    case LadderQueryStatus.Failed:
      return `failed: ${state.message}`;
    case LadderQueryStatus.Loaded:
      return JSON.stringify(state.result, null, 2);
  }
}
