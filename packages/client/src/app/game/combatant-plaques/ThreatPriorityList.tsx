import { ThreatManager, ThreatTableEntry, ThreatType } from "@speed-dungeon/common";
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
          .sort((a, b) => b[1].getTotal() - a[1].getTotal())
          .map(([entityId, threatTableEntry], i) => (
            <li key={entityId} className="mb-1 last:mb-0">
              <ThreatTrackerIcon
                extraStyles={""}
                entityId={entityId}
                threatTableEntry={threatTableEntry}
              />
            </li>
          ))}
      </ul>
    </div>
  );
}

function ThreatTrackerIcon(props: {
  extraStyles: string;
  entityId: string;
  threatTableEntry: ThreatTableEntry;
}) {
  const { extraStyles, entityId, threatTableEntry } = props;
  return (
    <button className={`border border-slate-400 w-8 ${extraStyles} mr-2 last:mr-0 `}>
      <div className="h-full w-full rounded-full bg-slate-600 border border-slate-400 flex flex-col items-center justify-center">
        <span className="">{entityId.slice(0, 2)}</span>
        <div>{threatTableEntry.entries[ThreatType.Stable].current}</div>
        <div>{threatTableEntry.entries[ThreatType.Volatile].current}</div>
      </div>
    </button>
  );
}
