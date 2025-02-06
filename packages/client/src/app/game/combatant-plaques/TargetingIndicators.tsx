import { AdventuringParty, COMBAT_ACTIONS, CombatActionName } from "@speed-dungeon/common";

interface Props {
  party: AdventuringParty;
  entityId: string;
}

export default function TargetingIndicators({ party, entityId }: Props) {
  const targetedBy = AdventuringParty.getIdsAndSelectedActionsOfCharactersTargetingCombatant(
    party,
    entityId
  );
  if (targetedBy instanceof Error) return <div>targeting error: {targetedBy.message}</div>;

  return targetedBy.length ? (
    <div
      className="absolute top-[-1.5rem] left-1/2 -translate-x-1/2 flex"
      style={{ zIndex: ZIndexLayers.TargetingIndicators }}
    >
      {targetedBy.map(([_, combatActionName], i) => (
        <TargetingIndicator key={i} combatActionName={combatActionName} />
      ))}
    </div>
  ) : (
    <></>
  );
}

import React from "react";
import { ZIndexLayers } from "@/app/z-index-layers";
import { CombatActionIntent } from "@speed-dungeon/common/src/combat/combat-actions/combat-action-intent";

interface TargetingIndicatorProps {
  combatActionName: CombatActionName;
}

function TargetingIndicator({ combatActionName }: TargetingIndicatorProps) {
  let color = "yellow-700";
  const action = COMBAT_ACTIONS[combatActionName];
  if (action.intent === CombatActionIntent.Benevolent) color = "green-600";

  return (
    <div
      className={`w-0 h-0 border-t-[1.5rem] border-t-${color}
      border-r-[1.5rem] border-r-transparent border-l-[1.5rem] 
      border-l-transparent`}
    />
  );
}
