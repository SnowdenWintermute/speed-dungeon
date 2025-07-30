import { CombatantClass, ThreatManager, ThreatTableEntry, ThreatType } from "@speed-dungeon/common";
import React from "react";

import Axe from "../../../../public/img/combatant-class-icons/axe.svg";
import DualSwords from "../../../../public/img/combatant-class-icons/dual-swords.svg";
import StaffWithSnowflake from "../../../../public/img/combatant-class-icons/staff-with-snowflake.svg";
import { useGameStore } from "@/stores/game-store";

interface Props {
  threatManager: null | ThreatManager;
}

export default function ThreatPriorityList({ threatManager }: Props) {
  if (threatManager === null) return <></>;

  const entries = threatManager.getEntries();

  return (
    <div className="min-h-full w-fit pointer-events-auto pr-2 translate-x-3">
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

  const combatantResult = useGameStore().getCombatant(entityId);
  if (combatantResult instanceof Error) return <div>no combatant found</div>;
  const icon = (() => {
    switch (combatantResult.combatantProperties.combatantClass) {
      case CombatantClass.Warrior:
        return <Axe className="h-full fill-slate-400" />;
      case CombatantClass.Mage:
        return <StaffWithSnowflake className="h-full fill-slate-400" />;
      case CombatantClass.Rogue:
        return <DualSwords className="h-full fill-slate-400" />;
    }
  })();

  return (
    <button className={`${extraStyles} w-full h-8`}>
      <div className="h-full w-full flex items-center justify-center relative">
        <div className="bg-slate-700 border border-slate-400 h-8 w-8 rounded-full absolute right-0">
          {<div> {entityId.slice(0, 2)}</div>}
          {icon}
        </div>
        <div className="bg-slate-700 border border-slate-400 flex h-full items-center justify-center mr-4 pl-2 pr-6">
          <div className="text-white w-1/2 flex justify-center">
            <span>{threatTableEntry.threatScoresByType[ThreatType.Stable].current}</span>
          </div>
          |
          <div className="text-slate-400 w-1/2 flex justify-center">
            <span>{threatTableEntry.threatScoresByType[ThreatType.Volatile].current}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
