import { ThreatManager } from "@speed-dungeon/common";
import React from "react";

interface Props {
  threatManager: null | ThreatManager;
}

export default function ThreatPriorityList({ threatManager }: Props) {
  if (threatManager === null) return <></>;

  const entries = threatManager.getEntries();

  return (
    <div className="min-h-full w-10 border">
      <ul>
        {Object.entries(entries)
          .sort((a, b) => b[1] - a[1])
          .map(([entityId, value]) => (
            <li>
              {entityId.slice(0, 2)}:{value}
            </li>
          ))}
      </ul>
    </div>
  );
}
