import { AdventuringParty, COMBAT_ACTIONS, CombatActionName } from "@speed-dungeon/common";

interface Props {
  party: AdventuringParty;
  entityId: string;
}

export const TargetingIndicators = observer(({ party, entityId }: Props) => {
  const targetedBy = AppStore.get().targetIndicatorStore.getIndicatorsTargetingCombatant(entityId);

  return targetedBy.length ? (
    <div
      className="absolute top-[-1.5rem] left-1/2 -translate-x-1/2 flex"
      style={{ zIndex: ZIndexLayers.TargetingIndicators }}
    >
      {targetedBy.map((indicator, i) => (
        <TargetingIndicator key={i} combatActionName={indicator.actionName} />
      ))}
    </div>
  ) : (
    <></>
  );
});

import React from "react";
import { ZIndexLayers } from "@/app/z-index-layers";
import { CombatActionIntent } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";

interface TargetingIndicatorProps {
  combatActionName: CombatActionName;
}

function TargetingIndicator({ combatActionName }: TargetingIndicatorProps) {
  let color = "yellow-700";
  const action = COMBAT_ACTIONS[combatActionName];
  if (action.targetingProperties.intent === CombatActionIntent.Benevolent) color = "green-600";

  return (
    <div
      className={`w-0 h-0 border-t-[1.5rem] border-t-${color}
      border-r-[1.5rem] border-r-transparent border-l-[1.5rem] 
      border-l-transparent`}
    />
  );
}
