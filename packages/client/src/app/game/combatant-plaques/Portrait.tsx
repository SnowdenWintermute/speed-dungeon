import { ThreatManager } from "@speed-dungeon/common";
import React from "react";

interface Props {
  portraitHeight: number;
  combatantLevel: number;
  numQuickActions: number;
  threatManager?: ThreatManager;
  portrait?: string;
}

export default function Portrait({
  portrait,
  portraitHeight,
  combatantLevel,
  numQuickActions,
}: Props) {
  return (
    <div className="relative rounded-full">
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-5 border border-slate-400 bg-slate-700 pr-2 pl-2 text-sm flex items-center justify-center">
        {numQuickActions}
      </div>
      <div
        className="h-full aspect-square mr-2 border border-slate-400 bg-slate-600 rounded-full overflow-hidden"
        style={{ height: `${portraitHeight}px` }}
      >
        {portrait && <img className="h-full object-cover" src={portrait} alt="portrait" />}
      </div>
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-5 border border-slate-400 bg-slate-700 pr-2 pl-2 text-sm flex items-center justify-center">
        {combatantLevel}
      </div>
    </div>
  );
}
