"use client";
import { observer } from "mobx-react-lite";
import React from "react";
import { AssetFetchProgressTracker } from "@speed-dungeon/common";

interface Props {
  progressTracker: AssetFetchProgressTracker;
}

export const AssetFetchStatus = observer(({ progressTracker }: Props) => {
  const { initialized, displayPercent, isComplete, fetchFailed } = progressTracker;

  if (fetchFailed) {
    return <div>asset fetch failed</div>;
  }
  if (initialized && isComplete) {
    return <div>up to date</div>;
  }
  if (initialized) {
    return <div>prefetching assets {displayPercent}%</div>;
  }
  return <div>loading application code...</div>;
});
