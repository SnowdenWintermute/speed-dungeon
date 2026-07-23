"use client";
import { observer } from "mobx-react-lite";
import React from "react";
import { AssetFetchProgressTracker } from "@speed-dungeon/common";
import { AssetFetchListItem } from "./AssetFetchListItem";

interface Props {
  progressTracker: AssetFetchProgressTracker;
}

export const AssetFetchList = observer(({ progressTracker }: Props) => {
  return (
    <ul className="flex flex-col flex-1 min-h-0 min-w-[420px] max-w-[720px] overflow-y-auto border border-slate-400">
      {Array.from(progressTracker.fetches).map(([assetId, entry]) => (
        <AssetFetchListItem key={assetId} assetId={assetId} entry={entry} />
      ))}
    </ul>
  );
});
