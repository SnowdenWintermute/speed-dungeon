"use client";
import { useEffect } from "react";
import { KeyedQueryCache } from "@/client-application/ladder-view/keyed-query-cache";
import { LadderQueryState } from "@/client-application/ladder-view/query-state";
import { useClientApplication } from "./create-client-application-context";

// ladder queries travel over the lobby connection, so a page loaded cold has to wait for it before
// asking. the query is undefined when the url failed to parse, and stable across renders otherwise
export function useLadderQuery<TQuery, TResult>(
  cache: KeyedQueryCache<TQuery, TResult>,
  queryOption: TQuery | undefined
): LadderQueryState<TResult> | undefined {
  const clientApplication = useClientApplication();
  const { isConnected } = clientApplication.uiStore.connectionStatus;

  useEffect(() => {
    if (!isConnected || queryOption === undefined) {
      return;
    }
    cache.request(queryOption);
  }, [cache, queryOption, isConnected]);

  if (queryOption === undefined) {
    return undefined;
  }
  return cache.get(queryOption);
}
