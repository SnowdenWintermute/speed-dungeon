"use client";
import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client-consts";
import { observer } from "mobx-react-lite";
import React from "react";
import { AssetFetchEntry, AssetId } from "@speed-dungeon/common";

interface Props {
  assetId: AssetId;
  entry: AssetFetchEntry;
}

function getTextColor({ wasCached, isComplete, aborted, started }: AssetFetchEntry) {
  if (wasCached) {
    return "text-blue-400";
  }
  if (isComplete) {
    return "text-green-600";
  }
  if (aborted) {
    return "text-yellow-400";
  }
  if (started) {
    return "text-zinc-300";
  }
  return UNMET_REQUIREMENT_TEXT_COLOR;
}

export const AssetFetchListItem = observer(({ assetId, entry }: Props) => {
  const { isComplete, started, aborted } = entry;

  const textColor = getTextColor(entry);

  const statusIndicator = (() => {
    if (isComplete) {
      return <span>✓</span>;
    }
    if (started || aborted) {
      return <div>...</div>;
    }
    return <span>✗</span>;
  })();

  return (
    <li className={`flex gap-2 px-1 ${textColor}`}>
      <div dir="rtl" className="flex-1 whitespace-nowrap text-ellipsis overflow-hidden">
        {assetId}
      </div>
      <div>{statusIndicator}</div>
    </li>
  );
});
