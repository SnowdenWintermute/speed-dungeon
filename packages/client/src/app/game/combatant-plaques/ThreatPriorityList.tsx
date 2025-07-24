import { ThreatManager } from "@speed-dungeon/common";
import React from "react";

interface Props {
  threatManager: null | ThreatManager;
}

export default function ThreatPriorityList({ threatManager }: Props) {
  if (threatManager === null) return <></>;

  const entries = threatManager.getEntries();

  return (
    <div className="min-h-full w-10 pointer-events-auto">
      <ul>
        {Object.entries(entries)
          .sort((a, b) => b[1] - a[1])
          .map(([entityId, value], i) => (
            <li key={entityId} className="mb-1 last:mb-0">
              <ThreatTrackerIcon extraStyles={""} entityId={entityId} value={value} />
            </li>
          ))}
      </ul>
    </div>
  );
}

function ThreatTrackerIcon(props: { extraStyles: string; entityId: string; value: number }) {
  const { extraStyles, entityId } = props;
  return (
    <button className={`border border-slate-400 h-8 w-8 ${extraStyles} mr-2 last:mr-0 `}>
      <div className="h-full w-full rounded-full bg-slate-600 border border-slate-400 flex items-center justify-center">
        <span className="">{entityId.slice(0, 2)}</span>
      </div>
    </button>
  );
}
