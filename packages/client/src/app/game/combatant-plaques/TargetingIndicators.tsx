import { AdventuringParty, AbilityName } from "@speed-dungeon/common";

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
    <div className="absolute top-[-1.5rem] left-1/2 -translate-x-1/2 z-20 flex">
      {targetedBy.map(([_, combatAction], i) => (
        <TargetingIndicator key={i} combatAction={combatAction} />
      ))}
    </div>
  ) : (
    <></>
  );
}

import React from "react";
import { CombatAction, CombatActionType } from "@speed-dungeon/common";

interface TargetingIndicatorProps {
  combatAction: CombatAction;
}

function TargetingIndicator({ combatAction }: TargetingIndicatorProps) {
  let color = "yellow-700";
  if (
    combatAction.type === CombatActionType.AbilityUsed &&
    combatAction.abilityName === AbilityName.Healing
  ) {
    color = "green-600";
  }
  if (combatAction.type === CombatActionType.ConsumableUsed) color = "green-600";
  return (
    <div
      className={`w-0 h-0 border-t-[1.5rem] border-t-${color}
      border-r-[1.5rem] border-r-transparent border-l-[1.5rem] 
      border-l-transparent`}
    />
  );
}
